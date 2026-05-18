-- ============================================================
-- URL Shortener Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Short URLs table
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  custom_alias TEXT UNIQUE,
  title TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_short_urls_user_id ON short_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_short_urls_short_code ON short_urls(short_code);
CREATE INDEX IF NOT EXISTS idx_short_urls_custom_alias ON short_urls(custom_alias);

-- URL clicks (analytics) table
CREATE TABLE IF NOT EXISTS url_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url_id UUID NOT NULL REFERENCES short_urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT
);

CREATE INDEX IF NOT EXISTS idx_url_clicks_short_url_id ON url_clicks(short_url_id);
CREATE INDEX IF NOT EXISTS idx_url_clicks_clicked_at ON url_clicks(clicked_at);

-- View: short_urls with total click count
CREATE OR REPLACE VIEW short_urls_with_stats AS
SELECT
  su.*,
  COUNT(uc.id) AS total_clicks,
  MAX(uc.clicked_at) AS last_clicked_at
FROM short_urls su
LEFT JOIN url_clicks uc ON uc.short_url_id = su.id
GROUP BY su.id;
