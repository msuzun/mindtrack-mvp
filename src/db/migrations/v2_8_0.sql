PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS coach_insight_state (
  insight_id TEXT PRIMARY KEY NOT NULL,
  dismissed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rest_days (
  date TEXT PRIMARY KEY NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rest_days_date ON rest_days(date);

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.8.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
