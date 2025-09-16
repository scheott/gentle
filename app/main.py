from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .schemas import CheckRequest, CheckResponse
from .checker import run_check
from .db import get_conn, insert_url_check
from . import billing
import orjson

app = FastAPI(title="GentleReader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOW_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(billing.router)

@app.get("/health")
async def health():
    return {"ok": True}

# api/app/main.py (modify /api/check to use auth)
from fastapi import Depends
from .auth import get_current_user

@app.post("/api/check", response_model=CheckResponse)
async def check(payload: CheckRequest, user=Depends(get_current_user)):
    verdict, reasons, summary, meta = await run_check(str(payload.url))
    # Try to persist with user id (if logged in)
    try:
        async with await get_conn() as conn:
            await insert_url_check(
                conn,
                user_id=user["id"] if user else None,
                url=str(payload.url),
                verdict=verdict,
                reasons=orjson.dumps(reasons).decode(),
                summary=summary,
                raw_meta=orjson.dumps(meta).decode(),
            )
    except Exception:
        pass
    return CheckResponse(verdict=verdict, reasons=reasons, summary=summary, meta=meta)

# api/app/main.py (add these small routes at bottom if you want)
from fastapi.responses import RedirectResponse, Response

@app.get("/")
def root():
    return RedirectResponse("/docs")

@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)
