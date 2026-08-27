-- MindTrack v2.4.0 - Smart Planning
PRAGMA foreign_keys = ON;

ALTER TABLE routines ADD COLUMN default_item_count INTEGER NOT NULL DEFAULT 30;
ALTER TABLE routines ADD COLUMN estimated_duration_minutes INTEGER NOT NULL DEFAULT 20;

CREATE TABLE IF NOT EXISTS smart_suggestions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('difficulty_increase','difficulty_decrease','reschedule','load_balance')),
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','dismissed')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_suggestions_status_created
ON smart_suggestions(status, created_at);

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.4.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;

-- Runtime migration checks PRAGMA table_info before ALTER TABLE, so this migration
-- remains idempotent for existing installations.
