"""Module responsible for starting the local Nilik HTTP server."""

import uvicorn

from nilik.config import Settings


def main() -> None:
    settings = Settings.local()
    uvicorn.run(
        "nilik.api.app:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
