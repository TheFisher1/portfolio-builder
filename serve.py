# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Local preview server for the Portfolio Builder.

    uv run serve.py                 # http://localhost:8000
    uv run serve.py --port 9000

A server is needed rather than opening index.html off the disk: the builder
fetches viewer.css and viewer.js at runtime to inline them into every export,
and browsers refuse those requests over file://.

Nothing is cached, so an edit shows up on the next reload.
"""

from __future__ import annotations

import argparse
import contextlib
import socketserver
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent.resolve()


class Handler(SimpleHTTPRequestHandler):
    # macOS reads some of these from the system registry, where .js has been
    # known to come back as text/plain. Pin the ones this project serves.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".css": "text/css",
        ".html": "text/html",
        ".js": "text/javascript",
        ".json": "application/json",
        ".pdf": "application/pdf",
        ".svg": "image/svg+xml",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        status = args[1] if len(args) > 1 else ""
        if status.startswith(("4", "5")):
            super().log_message(fmt, *args)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1", help="default: localhost only")
    args = parser.parse_args()

    socketserver.TCPServer.allow_reuse_address = True
    handler = partial(Handler, directory=str(ROOT))

    with ThreadingHTTPServer((args.bind, args.port), handler) as httpd:
        print(f"Portfolio Builder  →  http://{args.bind}:{args.port}")
        print("Ctrl-C to stop.")
        with contextlib.suppress(KeyboardInterrupt):
            httpd.serve_forever()
    print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
