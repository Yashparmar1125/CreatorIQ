from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):
        from fastapi import HTTPException
        
        # Log the full traceback
        logger.exception(f"Unhandled exception at {request.url.path}: {str(exc)}")

        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code, 
                content={"error": exc.detail, "meta": {"request_id": request.headers.get("x-request-id", "local-dev")}}
            )

        return JSONResponse(
            status_code=500,
            content={
                "error": {"code": "INTERNAL_ERROR", "message": "Unexpected server error.", "details": str(exc)},
                "meta": {"request_id": request.headers.get("x-request-id", "local-dev")},
            },
        )
