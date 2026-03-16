CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  birth TEXT,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
