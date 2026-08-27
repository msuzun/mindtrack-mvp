-- MindTrack v2.1.0 reference migration.
-- Runtime implementation checks table/column existence before executing these steps.
BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT,
  title TEXT NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily','specific_days','interval')),
  days_of_week TEXT NOT NULL DEFAULT '[]',
  target_time TEXT,
  interval_days INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'cognitive',
  target_minutes INTEGER NOT NULL DEFAULT 20,
  category_tag TEXT,
  priority_level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_instances (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT,
  goal_id TEXT,
  title TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  category_tag TEXT,
  priority_level INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'cognitive',
  target_minutes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL,
  UNIQUE (routine_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_task_instances_date
ON task_instances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_task_instances_date_completed
ON task_instances(scheduled_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_task_instances_goal
ON task_instances(goal_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_routines_active
ON routines(is_active, goal_id);

INSERT OR IGNORE INTO task_instances (
  id, routine_id, goal_id, title, scheduled_date, is_completed, completed_at,
  category_tag, priority_level, description, category, target_minutes, sort_order
)
SELECT
  'v1-' || id, NULL, NULL, title, date, completed, completed_at,
  category_tag, priority_level, description, category, target_minutes, sort_order
FROM tasks;

-- Runtime migration also maps focus_sessions.task_id to 'v1-' || task_id.
ALTER TABLE tasks RENAME TO tasks_v1_archive;

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.1.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;

COMMIT;
