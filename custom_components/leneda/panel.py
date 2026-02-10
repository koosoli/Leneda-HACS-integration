"""Panel views for the Leneda integration.

Serves the Vite-built frontend as an iframe panel inside Home Assistant.
Follows the same pattern as the ESPHome Designer reference project:
  - LenedaPanelView  → serves index.html at /leneda-panel/index.html
  - LenedaStaticView → serves JS/CSS assets at /leneda-panel/static/{path}

The sidebar panel is registered as an iframe pointing to LenedaPanelView's URL.
"""
from __future__ import annotations

import logging
import mimetypes
import re
from pathlib import Path
from typing import Any

import aiofiles
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

PANEL_URL = "/leneda-panel/index.html"
STATIC_URL = "/leneda-panel/static/{path:.*}"


class LenedaPanelView(HomeAssistantView):
    """Serve the Leneda dashboard index.html."""

    url = PANEL_URL
    name = "leneda:panel"
    requires_auth = False  # iframe needs to load; HA session cookie handles auth
    cors_allowed = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request) -> web.Response:
        """Return the dashboard HTML with rewritten asset paths."""
        frontend_dir = Path(__file__).parent / "frontend"
        index_path = frontend_dir / "index.html"

        if not index_path.exists():
            _LOGGER.error("Leneda frontend index.html not found at %s", index_path)
            return web.Response(status=404, text="Dashboard not found")

        try:
            async with aiofiles.open(index_path, mode="r", encoding="utf-8") as f:
                html = await f.read()

            # Rewrite relative asset paths to absolute static URLs
            # Vite outputs paths like ./assets/index-abc123.js or assets/index-abc123.css
            def rewrite_attr(match: re.Match) -> str:
                attr = match.group(1)
                path = match.group(2)
                # Don't rewrite external URLs, data URIs, or already absolute paths
                if path.startswith(("http://", "https://", "data:", "/")):
                    return match.group(0)
                # Strip leading ./ if present
                clean_path = path.lstrip("./")
                return f'{attr}="/leneda-panel/static/{clean_path}"'

            html = re.sub(r'(src|href)="([^"]+)"', rewrite_attr, html)

            return web.Response(
                body=html,
                content_type="text/html",
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            )
        except Exception as e:
            _LOGGER.error("Error serving Leneda dashboard: %s", e)
            return web.Response(status=500, text="Internal Server Error")


class LenedaStaticView(HomeAssistantView):
    """Serve static frontend assets (JS/CSS/images) from the frontend directory."""

    url = STATIC_URL
    name = "leneda:static"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, path: str) -> web.Response:
        """Serve a static file from the frontend directory tree."""
        # Security: block directory traversal
        if ".." in path or path.startswith("/"):
            _LOGGER.warning("Blocked path traversal attempt: %s", path)
            return web.Response(status=403, text="Forbidden")

        frontend_dir = Path(__file__).parent / "frontend"
        file_path = (frontend_dir / path).resolve()

        # Security: ensure resolved path is still under frontend_dir
        try:
            file_path.relative_to(frontend_dir.resolve())
        except ValueError:
            _LOGGER.warning("Blocked path escape attempt: %s → %s", path, file_path)
            return web.Response(status=403, text="Forbidden")

        if not file_path.exists() or not file_path.is_file():
            return web.Response(status=404, text="File not found")

        try:
            # Determine content type — manual overrides for critical web types
            content_type = None
            if path.endswith(".js"):
                content_type = "application/javascript"
            elif path.endswith(".css"):
                content_type = "text/css"
            elif path.endswith(".json"):
                content_type = "application/json"
            elif path.endswith(".svg"):
                content_type = "image/svg+xml"

            if not content_type:
                content_type, _ = mimetypes.guess_type(str(file_path))
            if not content_type:
                content_type = "application/octet-stream"

            is_binary = content_type.startswith(("font/", "image/", "application/octet"))

            if is_binary:
                async with aiofiles.open(file_path, mode="rb") as f:
                    content = await f.read()
            else:
                async with aiofiles.open(file_path, mode="r", encoding="utf-8") as f:
                    content = await f.read()

            # Vite filenames contain content hashes → safe to cache forever
            is_hashed = bool(re.search(r"-[a-zA-Z0-9]{8,}\.(js|css)$", path))
            cache_header = (
                "public, max-age=31536000, immutable"
                if is_hashed
                else "no-cache, no-store, must-revalidate"
            )

            return web.Response(
                body=content,
                content_type=content_type,
                headers={
                    "Cache-Control": cache_header,
                    "Access-Control-Allow-Private-Network": "true",
                },
            )
        except Exception as e:
            _LOGGER.error("Error serving Leneda static asset %s: %s", path, e)
            return web.Response(status=500, text="Internal Server Error")
