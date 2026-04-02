import uuid

import httpx
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse, Response

from app.core.auth import build_trusted_user_headers, get_bearer_token_from_request, verify_bearer_token
from app.core.routing import is_public_auth_path, resolve_target
from app.services.gateway_service import GatewayService


router = APIRouter()
service = GatewayService()


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.api_route("/v1/{path:path}", methods=["GET", "POST", "PATCH", "DELETE"])
async def route_all(path: str, request: Request):
    target = resolve_target(path)
    if target.service == "unknown":
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": {"code": "NOT_FOUND", "message": f"Unknown route: /v1/{path}", "details": {}},
                "meta": {"request_id": request.headers.get("x-request-id", "local-dev")},
            },
        )

    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())

    trusted_headers: dict[str, str] = {"X-Request-Id": request_id}
    if not is_public_auth_path(path, request.method):
        token = get_bearer_token_from_request(request)
        claims = verify_bearer_token(token)
        trusted_headers.update(build_trusted_user_headers(claims))

    upstream_url = f"{target.base_url}/{path}"
    query = dict(request.query_params)
    body = await request.body()

    # Forward most headers, but ensure trusted internal headers win.
    forward_headers: dict[str, str] = {}
    for k, v in request.headers.items():
        lk = k.lower()
        if lk in {"host", "content-length"}:
            continue
        if lk.startswith("x-user-") or lk in {"x-plan-tier", "x-request-id"}:
            continue
        forward_headers[k] = v
    forward_headers.update(trusted_headers)

    async with httpx.AsyncClient(timeout=120.0) as client:
        upstream = await client.request(
            method=request.method,
            url=upstream_url,
            params=query,
            content=body if body else None,
            headers=forward_headers,
        )

    # Forward headers from upstream to client
    response = Response(content=upstream.content, status_code=upstream.status_code)
    
    # Forward common headers
    for h in ["Content-Type", "Location", "WWW-Authenticate", "Content-Disposition"]:
        val = upstream.headers.get(h)
        if val:
            response.headers[h] = val

    # Multi-value headers (like Set-Cookie) need append
    cookies = upstream.headers.get_list("Set-Cookie")
    for cookie in cookies:
        response.headers.append("Set-Cookie", cookie)

    return response
