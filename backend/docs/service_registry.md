# CreatorIQ Service Registry & API Guide

This document describes the role of each microservice and how they interact within the CreatorIQ ecosystem.

## Service Map

| Service | Port | Primary Purpose | Key Dependencies |
| :--- | :--- | :--- | :--- |
| **Gateway** | `8000` | Entry point, Auth verification, Routing | Auth, Channel |
| **Auth** | `8001` | User registration, Login, Session JWTs | Database |
| **Channel** | `8002` | YouTube OAuth, Channel Metadata, Niches | Auth, YouTube API |
| **Trend** | `8003` | Trends discovery, SerpApi integration | SerpApi |
| **Strategy** | `8004` | AI Strategy generation, Growth tips | Trend, Channel, OpenAI |
| **Analytics** | `8005` | Performance tracking, Historical data | Channel |
| **Planner** | `8006` | Scriptwriting, Content scheduling | Strategy, Channel |

## Communication Patterns

### 1. External -> Internal (Gateway)
The Gateway acts as a reverse proxy. It intercepts all incoming requests, extracts the JWT, and adds the following headers to internal requests:
- `X-User-Id`: The UUID of the authenticated user.
- `X-Session-Id`: The current session identifier.

### 2. Service -> Service (REST/FastAPI)
Services communicate via internal HTTP calls. Use the service name as the hostname in a Docker environment, or `localhost` with the respective port during development.

**Example: Strategy asking Trend for data**
```python
# strategy-service/app/services/discovery.py
async def get_latest_trends():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8003/trends/discovery")
        return response.json()
```

## Service Responsibilities

### [Identity] Auth & Channel
- **Auth**: Manages the `users` table. Owns the "Source of Truth" for identity.
- **Channel**: Manages YouTube connectivity. If a user revokes YouTube access, this service handles the disconnect flow globally.

### [Intelligence] Trend & Strategy
- **Trend**: Runs background workers to fetch SerpApi data. It doesn't care about specific users; it cares about the *market*.
- **Strategy**: The "Brain". It combines *Market data* (from Trend) with *User data* (from Channel) to generate personalized advice.

### [Output] Planner & Analytics
- **Planner**: Transforms Strategy "ideas" into "tasks". Manages the workflow state (Draft -> Scripted -> Filmed -> Uploaded).
- **Analytics**: Captures "Reality". It compares the actual performance of a video against the "Predicted" performance from the Strategy session.

## Error Handling Standards
- **401 Unauthorized**: Handled exclusively by the Gateway.
- **403 Forbidden**: Service-level check if a user owns a resource (e.g., a `channel_id`).
- **404 Not Found**: Standard resource missing.
- **422 Unprocessable Entity**: Validation error (Pydantic).
- **500 Internal Server Error**: Logged with `X-Session-Id` for easy tracing in logs.

## Development Workflow

To start all microservices simultaneously for local development, use the provided runner scripts in the `backend/` directory:

### Windows (PowerShell)
```powershell
./run_dev.ps1
```

### Windows (Shortcut)
Double-click `run_dev.bat` to launch all services in separate terminal windows.

> [!TIP]
> Each service window will have `--reload` enabled. Any code changes in a service's directory will trigger an automatic restart of that specific service.
