PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS personal_records (
  id TEXT PRIMARY KEY NOT NULL,
  record_type TEXT NOT NULL UNIQUE CHECK (record_type IN ('max_items','peak_accuracy','longest_focus','best_streak_week')),
  value REAL NOT NULL,
  achieved_at TEXT NOT NULL,
  session_id TEXT,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS periodic_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly','monthly')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  journal_good TEXT,
  journal_struggle TEXT,
  journal_change TEXT,
  summary_metrics_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (period_type, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id TEXT PRIMARY KEY NOT NULL,
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('memory_capacity','logical_speed')),
  score REAL NOT NULL,
  baseline_comparison_delta REAL NOT NULL DEFAULT 0,
  taken_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_period ON periodic_reviews(period_type, period_end);
CREATE INDEX IF NOT EXISTS idx_benchmarks_type_taken ON benchmarks(benchmark_type, taken_at);

INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.7.0')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
