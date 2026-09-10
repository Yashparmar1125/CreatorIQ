import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.openrouter import (
    generate_content_ideas_json,
    generate_tag_list,
    generate_titles_and_script,
    generate_video_script,
)
from app.core.deps import UserContext, require_pro_or_agency
from app.models.strategy_models import ContentType, SessionStatus
from app.repositories.strategy_repository import StrategyRepository


class StrategyService:
    def __init__(self) -> None:
        self.repo = StrategyRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def _call_ml_score_idea(self, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{settings.ml_service_url}/internal/ml/score-idea",
                json=payload,
                headers={"X-Internal-Service-Token": settings.internal_service_token},
            )
            r.raise_for_status()
            return r.json()

    async def _call_ml_score_title(self, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{settings.ml_service_url}/internal/ml/score-title-ctr",
                json=payload,
                headers={"X-Internal-Service-Token": settings.internal_service_token},
            )
            r.raise_for_status()
            return r.json()

    async def create_session(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        input_topic: str,
        trend_id: uuid.UUID | None,
        input_config: dict | None,
    ) -> dict:
        cfg = input_config or {}
        sess = await self.repo.create_session(
            db,
            user_id=user.user_id,
            channel_id=channel_id,
            trend_id=trend_id,
            input_topic=input_topic,
            input_config=cfg,
            status=SessionStatus.complete,
            llm_model_version=settings.llm_model,
        )
        ideas: list[dict]
        if settings.openrouter_api_key:
            try:
                raw = await generate_content_ideas_json(input_topic)
                ideas = raw.get("ideas") or []
                if len(ideas) < 1:
                    raise ValueError("empty ideas")
            except Exception:
                ideas = [
                    {"title": f"Idea A: {input_topic}", "angle": "how-to"},
                    {"title": f"Idea B: {input_topic}", "angle": "story"},
                    {"title": f"Idea C: {input_topic}", "angle": "listicle"},
                ]
        else:
            ideas = [
                {"title": f"Idea A: {input_topic}", "angle": "how-to"},
                {"title": f"Idea B: {input_topic}", "angle": "story"},
                {"title": f"Idea C: {input_topic}", "angle": "listicle"},
            ]
        perf = 72.0
        try:
            ml = await self._call_ml_score_idea({"topic": input_topic, "ideas": ideas})
            inner = ml.get("data") or {}
            perf = float(inner.get("performance_score", perf))
        except Exception:
            pass
        await self.repo.add_generated(
            db,
            session_id=sess.id,
            content_type=ContentType.idea,
            content={"ideas": ideas},
            performance_score=perf,
        )
        await db.commit()
        return {
            "data": {
                "session_id": str(sess.id),
                "status": sess.status.value,
                "estimated_seconds": 0,
            },
            "meta": {"request_id": "local-dev"},
        }

    async def get_session(self, db: AsyncSession, user: UserContext, session_id: uuid.UUID) -> dict:
        s = await self.repo.get_session_for_user(db, session_id, user.user_id)
        if not s:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Session not found.", "details": {}},
            )
        generated = await self.repo.list_generated(db, session_id)
        return {
            "data": {
                "session": {
                    "id": str(s.id),
                    "channel_id": str(s.channel_id),
                    "trend_id": str(s.trend_id) if s.trend_id else None,
                    "input_topic": s.input_topic,
                    "input_config": s.input_config,
                    "status": s.status.value,
                    "created_at": s.created_at.isoformat(),
                },
                "generated": [
                    {
                        "id": str(g.id),
                        "content_type": g.content_type.value,
                        "content": g.content,
                        "predicted_ctr_score": float(g.predicted_ctr_score) if g.predicted_ctr_score is not None else None,
                        "performance_score": float(g.performance_score) if g.performance_score is not None else None,
                    }
                    for g in generated
                ],
            },
            "meta": {"request_id": "local-dev"},
        }

    async def generate_brief(
        self,
        db: AsyncSession,
        user: UserContext,
        topic: str,
        goal: str | None = None,
    ) -> dict:
        # 1. Fetch channel context
        channel_context = {}
        try:
            async with httpx.AsyncClient() as client:
                url = f"{settings.channel_service_url}/internal/channels/primary?user_id={user.user_id}"
                r = await client.get(url, headers={"X-Internal-Service-Token": settings.internal_service_token})
                if r.status_code == 200:
                    channel_context = r.json().get("data") or {}
        except Exception as e:
            print(f"Failed to fetch channel context for strategy: {str(e)}")

        # 2. Create Session
        input_config = {"goal": goal} if goal else {}
        sess = await self.repo.create_session(
            db,
            user_id=user.user_id,
            channel_id=uuid.UUID(channel_context.get("id")) if channel_context.get("id") else uuid.uuid4(),
            trend_id=None,
            input_topic=topic,
            input_config=input_config,
            status=SessionStatus.complete,
            llm_model_version=settings.llm_model,
        )

        # 3. Generate AI Brief
        from app.core.openrouter import _fallback_brief, _sanitize_topic, generate_unified_brief_json

        prompt_topic = f"{topic} (Primary goal: {goal})" if goal else topic
        try:
            brief_data = await generate_unified_brief_json(prompt_topic, channel_context)
            brief_data["source_topic"] = topic
            if goal and "goal" not in brief_data:
                brief_data["goal"] = goal
        except Exception as exc:
            print(f"[strategy] generate_brief failed: {exc}")
            brief_data = _fallback_brief(_sanitize_topic(topic), channel_context)
            if goal:
                brief_data["goal"] = goal
                brief_data["strategy_insight"] = f"Primary goal: {goal}. " + brief_data.get("strategy_insight", "")

        # 4. Save generated items (Title and Strategy Insight as part of one object)
        await self.repo.add_generated(
            db,
            session_id=sess.id,
            content_type=ContentType.idea,
            content={"brief": brief_data},
        )
        await db.commit()

        return {
            "data": {
                "session_id": str(sess.id),
                "brief": brief_data,
            },
            "meta": {"request_id": "local-dev"},
        }

    generate_unified_brief = generate_brief

    async def generate_titles(self, db: AsyncSession, user: UserContext, session_id: uuid.UUID) -> dict:
        s = await self.repo.get_session_for_user(db, session_id, user.user_id)
        if not s:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Session not found.", "details": {}},
            )
        if settings.openrouter_api_key:
            try:
                pack = await generate_titles_and_script(s.input_topic)
                titles = pack.get("titles") or [
                    f"{s.input_topic} — full guide",
                    f"Why {s.input_topic} matters in 2026",
                    f"{s.input_topic} (beginner friendly)",
                ]
            except Exception:
                titles = [
                    f"{s.input_topic} — full guide",
                    f"Why {s.input_topic} matters in 2026",
                    f"{s.input_topic} (beginner friendly)",
                ]
        else:
            titles = [
                f"{s.input_topic} — full guide",
                f"Why {s.input_topic} matters in 2026",
                f"{s.input_topic} (beginner friendly)",
            ]
        ctr = 0.05
        try:
            ml = await self._call_ml_score_title({"titles": titles, "topic": s.input_topic})
            inner = ml.get("data") or {}
            ctr = float(inner.get("predicted_ctr", ctr))
        except Exception:
            pass
        await self.repo.add_generated(
            db,
            session_id=session_id,
            content_type=ContentType.title,
            content={"titles": titles},
            predicted_ctr_score=ctr,
        )
        await db.commit()
        return {"data": {"session_id": str(session_id), "titles": titles, "predicted_ctr": ctr}, "meta": {"request_id": "local-dev"}}

    async def generate_tags(self, db: AsyncSession, user: UserContext, session_id: uuid.UUID) -> dict:
        s = await self.repo.get_session_for_user(db, session_id, user.user_id)
        if not s:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Session not found.", "details": {}},
            )
        if settings.openrouter_api_key:
            try:
                tags = await generate_tag_list(s.input_topic)
            except Exception:
                tags = ["tutorial", "tips", "2026", s.input_topic.split()[0].lower() if s.input_topic else "content"]
        else:
            tags = ["tutorial", "tips", "2026", s.input_topic.split()[0].lower() if s.input_topic else "content"]
        await self.repo.add_generated(
            db,
            session_id=session_id,
            content_type=ContentType.tag_set,
            content={"tags": tags},
        )
        await db.commit()
        return {"data": {"session_id": str(session_id), "tags": tags}, "meta": {"request_id": "local-dev"}}

    async def generate_script(self, db: AsyncSession, user: UserContext, session_id: uuid.UUID) -> dict:
        require_pro_or_agency(user.plan_tier)
        s = await self.repo.get_session_for_user(db, session_id, user.user_id)
        if not s:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Session not found.", "details": {}},
            )
        job_id = str(uuid.uuid4())
        if settings.openrouter_api_key:
            try:
                script = await generate_video_script(s.input_topic)
                outline = script.get("outline") or {"sections": ["Hook", "Main points", "CTA"], "topic": s.input_topic}
                content = {"script_job_id": job_id, "outline": outline, "full_script": script.get("full_script", "")}
            except Exception:
                content = {
                    "script_job_id": job_id,
                    "outline": {"sections": ["Hook", "Main points", "CTA"], "topic": s.input_topic},
                    "full_script": "",
                }
        else:
            content = {
                "script_job_id": job_id,
                "outline": {"sections": ["Hook", "Main points", "CTA"], "topic": s.input_topic},
                "full_script": "",
            }
        await self.repo.add_generated(
            db,
            session_id=session_id,
            content_type=ContentType.script_outline,
            content=content,
        )
        await db.commit()
        return {"data": {"session_id": str(session_id), "script_job_id": job_id, "status": "complete"}, "meta": {"request_id": "local-dev"}}

    async def get_script(self, db: AsyncSession, user: UserContext, session_id: uuid.UUID, script_job_id: str) -> dict:
        s = await self.repo.get_session_for_user(db, session_id, user.user_id)
        if not s:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Session not found.", "details": {}},
            )
        generated = await self.repo.list_generated(db, session_id)
        for g in generated:
            if g.content_type == ContentType.script_outline and g.content.get("script_job_id") == script_job_id:
                return {"data": {"status": "complete", "output": g.content}, "meta": {"request_id": "local-dev"}}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Script job not found.", "details": {}},
        )
