"""Module responsible for persisting inspection history in SQLite."""

import json
import sqlite3
from contextlib import closing
from dataclasses import asdict
from pathlib import Path

from nilik.domain.models import InspectionResult


class InspectionRepository:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.database_path)) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS inspections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sample_name TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    anomaly_score REAL NOT NULL,
                    region_count INTEGER NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def save(self, result: InspectionResult) -> int:
        payload = asdict(result)
        payload["decision"] = result.decision.value
        payload.pop("heatmap")
        with closing(sqlite3.connect(self.database_path)) as connection:
            cursor = connection.execute(
                """
                INSERT INTO inspections (
                    sample_name, decision, anomaly_score, region_count, payload_json
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    result.sample_name,
                    result.decision.value,
                    result.anomaly_score,
                    len(result.regions),
                    json.dumps(payload),
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def recent(self, limit: int = 20) -> list[dict[str, object]]:
        safe_limit = min(max(limit, 1), 100)
        with closing(sqlite3.connect(self.database_path)) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT id, sample_name, decision, anomaly_score, region_count, created_at
                FROM inspections ORDER BY id DESC LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def clear(self) -> None:
        with closing(sqlite3.connect(self.database_path)) as connection:
            connection.execute("DELETE FROM inspections")
            connection.commit()
