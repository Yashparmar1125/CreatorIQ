from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class RouteTarget:
    service: str
    base_url: str


def resolve_target(path: str) -> RouteTarget:
    """
    Resolve a /v1/{path} request to a downstream service.
    `path` is the portion after /v1/.
    """
    first = path.split("/", 1)[0]

    if first == "auth":
        return RouteTarget(service="auth", base_url=settings.auth_service_url)
    if first == "channels":
        return RouteTarget(service="channel", base_url=settings.channel_service_url)
    if first == "trends":
        return RouteTarget(service="trend", base_url=settings.trend_service_url)
    if first == "strategy":
        return RouteTarget(service="strategy", base_url=settings.strategy_service_url)
    if first == "planner":
        return RouteTarget(service="planner", base_url=settings.planner_service_url)
    if first == "analytics":
        return RouteTarget(service="analytics", base_url=settings.analytics_service_url)
    if first == "ml":
        return RouteTarget(service="ml", base_url=settings.ml_service_url)

    return RouteTarget(service="unknown", base_url="")


def is_public_auth_path(path: str, method: str) -> bool:
    m = method.upper()
    if m == "POST" and path in {"auth/register", "auth/login", "auth/token/refresh"}:
        return True
    if m == "GET" and path in {"auth/google/oauth-url", "auth/google/callback", "auth/health"}:
        return True
    if m == "GET" and (path.startswith("ml/evaluations") or path == "ml/health"):
        return True
    if "/internal/" in f"/{path}":
        return True
    return False

