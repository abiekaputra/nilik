"""Module responsible for resolving Nilik runtime configuration."""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    root: Path
    database_path: Path
    artifact_path: Path
    host: str = "127.0.0.1"
    port: int = 4600

    @classmethod
    def local(cls) -> "Settings":
        root = Path(__file__).resolve().parents[2]
        return cls(
            root=root,
            database_path=root / "runtime" / "nilik.db",
            artifact_path=root / "artifacts" / "surface-v1.json",
        )

    def prepare(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.artifact_path.parent.mkdir(parents=True, exist_ok=True)
