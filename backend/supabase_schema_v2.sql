-- ============================================================
-- Schema v2 — run this in Supabase SQL Editor after v1
-- ============================================================

-- New columns on short_urls
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS password_hash   TEXT;
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS max_clicks      INTEGER;
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS tags            TEXT[]  DEFAULT '{}';
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS is_public       BOOLEAN DEFAULT FALSE;
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS preview_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS ab_url          TEXT;
ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS ab_split        INTEGER DEFAULT 50;

-- Track which A/B variant was served
ALTER TABLE url_clicks ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'a';

-- Refresh the stats view to pick up new columns
DROP VIEW IF EXISTS short_urls_with_stats;
CREATE VIEW short_urls_with_stats AS
SELECT
  su.*,
  COUNT(uc.id)                                          AS total_clicks,
  MAX(uc.clicked_at)                                    AS last_clicked_at,
  COUNT(uc.id) FILTER (WHERE uc.variant = 'a')          AS ab_clicks_a,
  COUNT(uc.id) FILTER (WHERE uc.variant = 'b')          AS ab_clicks_b
FROM short_urls su
LEFT JOIN url_clicks uc ON uc.short_url_id = su.id
GROUP BY su.id;
