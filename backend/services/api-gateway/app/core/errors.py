from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):  # type: ignore[no-redef]
        # Let HTTPException be handled by FastAPI default handler
        from fastapi import HTTPException

        if isinstance(exc, HTTPException):
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail, "meta": {"request_id": request.headers.get("x-request-id", "local-dev")}})

        return JSONResponse(
            status_code=500,
            content={
                "error": {"code": "INTERNAL_ERROR", "message": "Unexpected server error.", "details": {}},
                "meta": {"request_id": request.headers.get("x-request-id", "local-dev")},
            },
        )

