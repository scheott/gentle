# api/app/auth.py
import time, json
from typing import Optional, Dict, Any
import httpx
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

bearer = HTTPBearer(auto_error=False)

# Derive JWKS URL from your Supabase URL
def _jwks_url():
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/auth/v1/.well-known/jwks.json"

_JWKS_CACHE: Dict[str, Any] = {"keys": None, "ts": 0}

async def _get_jwks():
    # cache for 10 minutes
    if _JWKS_CACHE["keys"] and (time.time() - _JWKS_CACHE["ts"] < 600):
        return _JWKS_CACHE["keys"]
    async with httpx.AsyncClient(timeout=10) as hc:
        r = await hc.get(_jwks_url())
        r.raise_for_status()
        data = r.json()
        _JWKS_CACHE["keys"] = data
        _JWKS_CACHE["ts"] = time.time()
        return data

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    """Returns dict with user fields if Authorization header present and valid, else None."""
    if not creds:
        return None
    token = creds.credentials
    jwks = await _get_jwks()
    try:
        # Use PyJWT with JWKS
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        key = None
        for k in jwks["keys"]:
            if k.get("kid") == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(k))
                break
        if key is None:
            raise HTTPException(status_code=401, detail="invalid_jwt_kid")

        payload = jwt.decode(
            token,
            key=key,
            algorithms=[unverified.get("alg", "RS256")],
            audience=settings.SUPABASE_JWT_AUD or "authenticated",
            options={"verify_exp": True},
        )
        # Typical Supabase claims: sub (user id), email, role, etc.
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "aud": payload.get("aud"),
            "raw": payload,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token_expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"invalid_token: {e}")
