import stripe
from fastapi import APIRouter, HTTPException, Request
from .config import settings
from .schemas import CheckoutRequest, CheckoutResponse, PortalResponse
from .db import get_conn

router = APIRouter(prefix="/api/billing", tags=["billing"])
stripe.api_key = settings.STRIPE_SECRET_KEY

# api/app/billing.py (patch)
from fastapi import Depends
from .auth import get_current_user

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="login_required")
    try:
        # (optional) look up existing stripe_customer_id
        async with await get_conn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("select stripe_customer_id from subscriptions where user_id = %s", (user["id"],))
                row = await cur.fetchone()
                customer_id = row[0] if row and row[0] else None

        if not customer_id:
            customer = stripe.Customer.create(email=user.get("email") or None)
            customer_id = customer.id

        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
            success_url="http://localhost:5173/thanks?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cancel",
            customer=customer_id,
            metadata={"user_id": user["id"]},
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    async with await get_conn() as conn:
        if event["type"] == "checkout.session.completed":
            sess = event["data"]["object"]
            sub_id = sess.get("subscription")
            cust_id = sess.get("customer")
            user_id = sess["metadata"].get("user_id")
            # upsert
            await conn.execute(
                """
                insert into subscriptions(user_id, stripe_customer_id, stripe_sub_id, status)
                values (%s, %s, %s, 'active')
                on conflict (user_id)
                do update set stripe_customer_id = excluded.stripe_customer_id,
                              stripe_sub_id = excluded.stripe_sub_id,
                              status = 'active'
                """,
                (user_id, cust_id, sub_id),
            )
        elif event["type"] == "customer.subscription.updated":
            sub = event["data"]["object"]
            status = sub["status"]  # active, past_due, canceled, trialing
            # lookup user_id by sub_id
            await conn.execute(
                """
                update subscriptions set status = %s where stripe_sub_id = %s
                """,
                (status, sub["id"]),
            )
        elif event["type"] == "customer.subscription.deleted":
            sub = event["data"]["object"]
            await conn.execute(
                """update subscriptions set status = 'canceled' where stripe_sub_id = %s""",
                (sub["id"],),
            )
    return {"ok": True}

@router.get("/portal", response_model=PortalResponse)
async def portal(customer_id: str):
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:5173/account",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
