from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api import router
from .config import get_settings
from .db import get_session


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized HTTP requests before they reach route parsing."""

    def __init__(self, app, max_bytes: int):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request is too large for this service."},
                    )
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid content length."})
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        if get_settings().app_env.lower() in {"staging", "production"}:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


def create_app() -> FastAPI:
    settings = get_settings()
    settings.validate_runtime()
    production_like = settings.app_env.lower() in {"staging", "production"}
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Server-authoritative verticale MVP-slice voor Fiscale Lijn.",
        docs_url=None if production_like else "/docs",
        redoc_url=None if production_like else "/redoc",
        openapi_url=None if production_like else "/openapi.json",
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.max_request_bytes)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.include_router(router, prefix=settings.api_prefix)

    @app.get("/health")
    def health() -> dict[str, str]:
        payload: dict[str, str] = {"status": "healthy", "version": settings.app_version}
        if not production_like:
            payload["environment"] = settings.app_env
        return payload

    @app.get("/ready")
    def ready(session=Depends(get_session)):
        try:
            session.execute(text("SELECT 1"))
        except SQLAlchemyError:
            return JSONResponse(status_code=503, content={"status": "not_ready"})
        return {"status": "ready"}

    return app


app = create_app()
