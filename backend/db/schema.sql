-- SafeScore Database Schema
-- Chạy file này để tạo các bảng ban đầu

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moods (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  tags        TEXT[],
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deadlines (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  subject     VARCHAR(100),
  type        VARCHAR(50) DEFAULT 'bài tập',
  due_date    TIMESTAMP NOT NULL,
  priority    SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  progress    SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  done        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id          SERIAL PRIMARY KEY,
  post_id     INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  emoji       VARCHAR(10) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moods_user_date ON moods(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deadlines_user ON deadlines(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(created_at DESC);
