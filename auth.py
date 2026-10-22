"""
Authentication Module & Enterprise SSO Placeholder

This module handles user identification for multi-user labeling sessions across the LAN.
It provides a modular FastAPI dependency `get_current_user()`.
"""

from fastapi import Request, HTTPException, Security, status
from typing import Optional

COOKIE_NAME = "labeler_user"
HEADER_NAME = "X-User-Id"

def sanitize_user_id(raw_id: str) -> str:
    """Sanitizes user input to prevent path traversal or formatting issues."""
    cleaned = "".join(c for c in raw_id if c.isalnum() or c in ("-", "_", " ", ".")).strip()
    return cleaned[:64]

async def get_current_user(request: Request) -> str:
    """
    Modular FastAPI Dependency to retrieve the authenticated user ID.

    Currently checks:
    1. Request Header: `X-User-Id` (common when behind API gateways or reverse proxies)
    2. HTTP Cookie: `labeler_user` (set via mock login screen)
    3. Query parameter: `user_id` (convenient for API debugging or quick linking)

    ========================================================================================
    [ENTERPRISE SSO INTEGRATION GUIDE]
    When you are ready to connect your company's SSO (e.g., Okta, Azure AD, Keycloak, SAML):
    1. Replace or extend the logic below:
       - Validate JWT token from `Authorization: Bearer <token>`
       - Verify signature against your SSO issuer's JWKS endpoint
       - Extract claims: user_id = claims.get("preferred_username") or claims.get("sub")
    2. If your LAN infrastructure uses an authenticating reverse proxy (like Nginx with OAuth2-Proxy,
       Traefik ForwardAuth, or Cloudflare Access):
       - Read trusted headers such as `request.headers.get("X-Forwarded-User")` or `request.headers.get("Remote-User")`
    ========================================================================================
    """
    user_id: Optional[str] = None

    # 1. Check custom header (e.g. injected by reverse proxy or frontend fetch)
    header_val = request.headers.get(HEADER_NAME)
    if header_val and header_val.strip():
        user_id = header_val.strip()

    # 2. Check Cookie
    if not user_id:
        cookie_val = request.cookies.get(COOKIE_NAME)
        if cookie_val and cookie_val.strip():
            user_id = cookie_val.strip()

    # 3. Check Query parameter
    if not user_id:
        query_val = request.query_params.get("user_id")
        if query_val and query_val.strip():
            user_id = query_val.strip()

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please enter your Employee ID / Username."
        )

    clean_id = sanitize_user_id(user_id)
    if not clean_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID provided."
        )

    return clean_id
