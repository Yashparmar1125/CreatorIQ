from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionClient:
    """Client for Notion API v1 (workspace page search, block reading & strategy brief export)."""

    def _headers(self, token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {token.strip()}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }

    async def verify_token(self, token: str, *, client: httpx.AsyncClient | None = None) -> dict[str, Any]:
        """Verify a Notion token or OAuth access token via GET /v1/users/me."""
        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=15.0)
        try:
            res = await client.get(f"{NOTION_API_BASE}/users/me", headers=self._headers(token))
            if res.status_code != 200:
                return {"valid": False, "error": f"Notion returned {res.status_code}"}
            data = res.json()
            bot_name = data.get("name") or data.get("bot", {}).get("workspace_name") or "Notion Workspace"
            return {"valid": True, "workspace_name": bot_name}
        except Exception as e:
            return {"valid": False, "error": str(e)}
        finally:
            if own_client and client:
                await client.aclose()

    async def search_pages(
        self,
        token: str,
        *,
        query: str = "",
        max_results: int = 8,
        include_snippets: bool = True,
        client: httpx.AsyncClient | None = None,
    ) -> list[dict[str, Any]]:
        """Search accessible Notion pages and extract text snippets from top matches."""
        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=20.0)

        payload: dict[str, Any] = {
            "page_size": max(1, min(max_results, 20)),
            "filter": {"value": "page", "property": "object"},
            "sort": {"direction": "descending", "timestamp": "last_edited_time"},
        }
        if query.strip():
            payload["query"] = query.strip()

        try:
            res = await client.post(
                f"{NOTION_API_BASE}/search",
                json=payload,
                headers=self._headers(token),
            )
            if res.status_code != 200:
                logger.warning("Notion search_pages returned %s: %s", res.status_code, res.text[:250])
                return []

            items = res.json().get("results", [])
            pages: list[dict[str, Any]] = []

            for idx, item in enumerate(items):
                page_id = item.get("id")
                title = self._extract_page_title(item)
                page_obj: dict[str, Any] = {
                    "id": page_id,
                    "title": title or "Untitled Notion Page",
                    "url": item.get("url"),
                    "modified_at": item.get("last_edited_time"),
                    "source": "notion",
                    "snippet": "",
                }

                if include_snippets and idx < 3 and page_id:
                    snippet = await self.get_page_text(token, page_id=page_id, client=client)
                    if snippet:
                        page_obj["snippet"] = snippet[:1200]

                pages.append(page_obj)

            return pages
        except Exception as e:
            logger.warning("Notion search_pages error: %s", e)
            return []
        finally:
            if own_client and client:
                await client.aclose()

    async def get_page_text(
        self,
        token: str,
        *,
        page_id: str,
        client: httpx.AsyncClient | None = None,
    ) -> str:
        """Fetch top-level blocks of a Notion page and convert to plain text."""
        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=15.0)

        try:
            res = await client.get(
                f"{NOTION_API_BASE}/blocks/{page_id}/children",
                params={"page_size": 40},
                headers=self._headers(token),
            )
            if res.status_code != 200:
                return ""
            blocks = res.json().get("results", [])
            lines: list[str] = []
            for b in blocks:
                btype = b.get("type")
                if not btype:
                    continue
                rich_text = b.get(btype, {}).get("rich_text", [])
                text_line = "".join([rt.get("plain_text", "") for rt in rich_text if isinstance(rt, dict)]).strip()
                if text_line:
                    lines.append(text_line)
            return "\n".join(lines)[:2500]
        except Exception:
            return ""
        finally:
            if own_client and client:
                await client.aclose()

    async def create_page(
        self,
        token: str,
        *,
        title: str,
        content: str,
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, Any]:
        """
        Create a new Notion page under the creator's first accessible parent page
        and populate it with structured blocks from `content`.
        """
        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=25.0)

        try:
            # Find a parent page shared with the integration
            pages = await self.search_pages(token, max_results=5, include_snippets=False, client=client)
            if not pages:
                return {
                    "error": "No Notion pages are shared with the integration yet. Share at least one parent page in Notion with your integration.",
                    "status_code": 400,
                }
            parent_page_id = pages[0]["id"]

            # Convert markdown paragraphs into Notion blocks (max 80 blocks, 1800 chars each)
            children_blocks: list[dict[str, Any]] = []
            for raw_para in content.split("\n\n"):
                para = raw_para.strip()
                if not para:
                    continue
                if para.startswith("# "):
                    children_blocks.append({
                        "object": "block",
                        "type": "heading_1",
                        "heading_1": {"rich_text": [{"type": "text", "text": {"content": para[2:].strip()[:1800]}}]},
                    })
                elif para.startswith("## ") or para.startswith("### "):
                    clean_h = para.lstrip("#").strip()
                    children_blocks.append({
                        "object": "block",
                        "type": "heading_2",
                        "heading_2": {"rich_text": [{"type": "text", "text": {"content": clean_h[:1800]}}]},
                    })
                else:
                    children_blocks.append({
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {"rich_text": [{"type": "text", "text": {"content": para[:1800]}}]},
                    })
                if len(children_blocks) >= 60:
                    break

            body = {
                "parent": {"type": "page_id", "page_id": parent_page_id},
                "properties": {
                    "title": {
                        "title": [{"type": "text", "text": {"content": title[:200]}}],
                    }
                },
                "children": children_blocks,
            }

            res = await client.post(
                f"{NOTION_API_BASE}/pages",
                json=body,
                headers=self._headers(token),
            )
            if res.status_code not in (200, 201):
                err_msg = res.text[:350]
                try:
                    err_msg = res.json().get("message") or err_msg
                except Exception:
                    pass
                return {"error": err_msg, "status_code": res.status_code}

            data = res.json()
            return {
                "id": data.get("id"),
                "title": title,
                "url": data.get("url"),
                "created_at": data.get("created_time"),
                "source": "notion",
            }
        except Exception as e:
            logger.exception("Notion create_page exception: %s", e)
            return {"error": str(e), "status_code": 500}
        finally:
            if own_client and client:
                await client.aclose()

    @staticmethod
    def _extract_page_title(item: dict[str, Any]) -> str:
        props = item.get("properties") or {}
        for prop_val in props.values():
            if isinstance(prop_val, dict) and prop_val.get("type") == "title":
                title_arr = prop_val.get("title") or []
                text = "".join([t.get("plain_text", "") for t in title_arr if isinstance(t, dict)]).strip()
                if text:
                    return text
        return "Untitled Notion Page"
