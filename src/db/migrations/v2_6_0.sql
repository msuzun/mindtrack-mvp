PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('memory','focus','logic','mindfulness')),
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  level TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  curriculum_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_enrolled_programs (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  paused_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrolled_programs_status ON user_enrolled_programs(status);
CREATE INDEX IF NOT EXISTS idx_enrolled_programs_goal ON user_enrolled_programs(goal_id);

ALTER TABLE routines ADD COLUMN program_enrollment_id TEXT;
ALTER TABLE routines ADD COLUMN program_week INTEGER;

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.6.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
