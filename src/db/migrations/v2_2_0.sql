-- MindTrack v2.2.0 - Training Sessions
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  task_instance_id TEXT,
  session_type TEXT NOT NULL
    CHECK (session_type IN ('memory','cognitive','mindfulness','free_focus')),
  total_items INTEGER,
  correct_count INTEGER,
  incorrect_count INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  accuracy_rate REAL,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_instance_id) REFERENCES task_instances(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_task_created
ON training_sessions(task_instance_id, created_at);

CREATE INDEX IF NOT EXISTS idx_training_sessions_type_created
ON training_sessions(session_type, created_at);

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.2.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
