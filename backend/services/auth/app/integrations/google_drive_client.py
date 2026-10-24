from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"
DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"


class GoogleDriveClient:
    """Client for Google Drive & Google Docs REST API v3 (Knowledge Vault read & script export)."""

    async def search_documents(
        self,
        access_token: str,
        *,
        query: str = "",
        max_results: int = 8,
        include_snippets: bool = True,
        client: httpx.AsyncClient | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search the creator's Google Drive for Google Docs, text files, or notes matching `query`,
        and optionally extract text excerpts from top matching Google Docs.
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        # Filter to Google Docs and text/markdown files, non-trashed
        q_parts = [
            "trashed = false",
            "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'text/markdown')",
        ]
        clean_q = query.strip().replace("'", "\\'")
        if clean_q:
            q_parts.append(f"(name contains '{clean_q}' or fullText contains '{clean_q}')")

        params = {
            "q": " and ".join(q_parts),
            "pageSize": max(1, min(max_results, 20)),
            "orderBy": "modifiedTime desc",
            "fields": "files(id, name, mimeType, modifiedTime, webViewLink, description)",
        }

        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=20.0)

        try:
            res = await client.get(DRIVE_FILES_URL, params=params, headers=headers)
            if res.status_code != 200:
                logger.warning("Google Drive search_documents returned %s: %s", res.status_code, res.text[:250])
                return []

            files = res.json().get("files", [])
            results: list[dict[str, Any]] = []

            for idx, f in enumerate(files):
                file_id = f.get("id")
                mime_type = f.get("mimeType", "")
                doc_item: dict[str, Any] = {
                    "id": file_id,
                    "title": f.get("name") or "Untitled Document",
                    "mime_type": mime_type,
                    "modified_at": f.get("modifiedTime"),
                    "url": f.get("webViewLink") or (f"https://docs.google.com/document/d/{file_id}/edit" if file_id else None),
                    "snippet": "",
                }

                # Fetch plain-text excerpt for top 3 Google Docs so Copilot can read actual script/notes content
                if include_snippets and idx < 3 and file_id:
                    snippet = await self.get_document_text(access_token, file_id=file_id, mime_type=mime_type, client=client)
                    if snippet:
                        doc_item["snippet"] = snippet[:1200]

                results.append(doc_item)

            return results
        except Exception as e:
            logger.warning("Google Drive search_documents error: %s", e)
            return []
        finally:
            if own_client and client:
                await client.aclose()

    async def get_document_text(
        self,
        access_token: str,
        *,
        file_id: str,
        mime_type: str = "application/vnd.google-apps.document",
        client: httpx.AsyncClient | None = None,
    ) -> str:
        """Export a Google Doc as plain text or download a plain-text file."""
        headers = {"Authorization": f"Bearer {access_token}"}
        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=15.0)

        try:
            if mime_type == "application/vnd.google-apps.document":
                url = f"{DRIVE_FILES_URL}/{file_id}/export"
                res = await client.get(url, params={"mimeType": "text/plain"}, headers=headers)
            else:
                url = f"{DRIVE_FILES_URL}/{file_id}"
                res = await client.get(url, params={"alt": "media"}, headers=headers)

            if res.status_code == 200:
                return res.text.strip()[:3000]
            return ""
        except Exception as e:
            logger.debug("Google Drive get_document_text failed for %s: %s", file_id, e)
            return ""
        finally:
            if own_client and client:
                await client.aclose()

    async def create_google_doc(
        self,
        access_token: str,
        *,
        title: str,
        content: str,
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, Any]:
        """
        Create a new Google Doc in the creator's Drive using Drive v3 multipart upload
        (automatically converts plain text / markdown into an editable Google Doc).
        """
        import json

        boundary = "===CreatorIQVaultBoundary==="
        metadata = {
            "name": title,
            "mimeType": "application/vnd.google-apps.document",
        }
        body_parts = (
            f"--{boundary}\r\n"
            "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{json.dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
            f"{content}\r\n"
            f"--{boundary}--\r\n"
        )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        }

        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=25.0)

        try:
            res = await client.post(
                f"{DRIVE_UPLOAD_URL}&fields=id,name,webViewLink,createdTime",
                content=body_parts.encode("utf-8"),
                headers=headers,
            )
            if res.status_code not in (200, 201):
                err_msg = res.text[:400]
                try:
                    err_msg = res.json().get("error", {}).get("message") or err_msg
                except Exception:
                    pass
                logger.error("Google Drive create_google_doc failed %s: %s", res.status_code, err_msg)
                return {"error": err_msg, "status_code": res.status_code}

            data = res.json()
            doc_id = data.get("id")
            return {
                "id": doc_id,
                "title": data.get("name") or title,
                "url": data.get("webViewLink") or f"https://docs.google.com/document/d/{doc_id}/edit",
                "created_at": data.get("createdTime"),
                "source": "drive",
            }
        except Exception as e:
            logger.exception("Google Drive create_google_doc exception: %s", e)
            return {"error": str(e), "status_code": 500}
        finally:
            if own_client and client:
                await client.aclose()
