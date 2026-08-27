CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  hour INTEGER NOT NULL DEFAULT 9 CHECK (hour BETWEEN 0 AND 23),
  minute INTEGER NOT NULL DEFAULT 0 CHECK (minute BETWEEN 0 AND 59),
  tone TEXT NOT NULL DEFAULT 'balanced' CHECK (tone IN ('gentle', 'balanced', 'energetic')),
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '08:30',
  auto_reduce_frequency INTEGER NOT NULL DEFAULT 1 CHECK (auto_reduce_frequency IN (0, 1)),
  ignored_count INTEGER NOT NULL DEFAULT 0 CHECK (ignored_count >= 0),
  enabled_categories TEXT NOT NULL DEFAULT '["memory","cognitive","general"]',
  last_app_opened_at TEXT
);

INSERT OR IGNORE INTO notification_settings (id) VALUES (1);
