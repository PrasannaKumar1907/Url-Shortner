const express   = require('express');
const validator = require('validator');
const bcrypt    = require('bcryptjs');
const https     = require('https');
const http      = require('http');
const supabase  = require('../db');
const { authenticate }   = require('../middleware/auth');
const { generateShortCode } = require('../utils/generateCode');

const router = express.Router();

/* ── helpers ─────────────────────────────────────────────── */
async function uniqueCode() {
  for (;;) {
    const code = generateShortCode();
    const { data } = await supabase.from('short_urls').select('id').eq('short_code', code).single();
    if (!data) return code;
  }
}

function buildInsert(userId, body, short_code) {
  const { original_url, custom_alias, title, expires_at,
          max_clicks, tags, is_public, preview_enabled, ab_url, ab_split } = body;

  // Base fields — always present (v1 schema)
  const row = {
    user_id:      userId,
    original_url,
    short_code,
    title:        title?.trim() || null,
    expires_at:   expires_at   || null,
    custom_alias: custom_alias ? short_code : null,
  };

  // Advanced fields — only include when explicitly provided (v2 schema columns)
  // This prevents PGRST204 errors if v2 migration hasn't been applied yet
  if (max_clicks)                        row.max_clicks      = Number(max_clicks);
  if (Array.isArray(tags) && tags.length) row.tags            = tags;
  if (is_public)                          row.is_public       = true;
  if (preview_enabled)                    row.preview_enabled = true;
  if (ab_url?.trim()) {
    row.ab_url   = ab_url.trim();
    row.ab_split = Number(ab_split ?? 50);
  }
  // password_hash is set separately after bcrypt.hash()

  return row;
}

/* ── GET /api/urls ───────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('short_urls_with_stats')
    .select('*')
    .eq('user_id', req.user.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Internal server error' });
  res.json({ urls: data });
});

/* ── POST /api/urls ──────────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
  try {
    const { original_url, custom_alias, password, ab_url } = req.body;

    if (!original_url) return res.status(400).json({ error: 'URL is required' });
    if (!validator.isURL(original_url, { require_protocol: true }))
      return res.status(400).json({ error: 'Invalid URL – include http:// or https://' });
    if (ab_url && !validator.isURL(ab_url, { require_protocol: true }))
      return res.status(400).json({ error: 'Invalid A/B URL' });

    let short_code;
    if (custom_alias) {
      const alias = custom_alias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (alias.length < 3 || alias.length > 30)
        return res.status(400).json({ error: 'Alias must be 3–30 chars (letters, numbers, - _)' });
      const { data: ex } = await supabase.from('short_urls').select('id')
        .or(`short_code.eq.${alias},custom_alias.eq.${alias}`).single();
      if (ex) return res.status(409).json({ error: 'Alias already taken' });
      short_code = alias;
    } else {
      short_code = await uniqueCode();
    }

    const row = buildInsert(req.user.userId, req.body, short_code);
    if (password) row.password_hash = await bcrypt.hash(password, 12);

    const { data: url, error } = await supabase.from('short_urls').insert(row).select('*').single();
    if (error) throw error;
    res.status(201).json({ url: { ...url, total_clicks: 0, last_clicked_at: null, ab_clicks_a: 0, ab_clicks_b: 0 } });
  } catch (err) {
    console.error('Create URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── POST /api/urls/bulk ─────────────────────────────────── */
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0)
      return res.status(400).json({ error: 'Provide an array of URLs' });
    if (urls.length > 50)
      return res.status(400).json({ error: 'Maximum 50 URLs per bulk request' });

    const results = [];
    for (const item of urls) {
      const original_url = typeof item === 'string' ? item.trim() : item.original_url?.trim();
      if (!original_url || !validator.isURL(original_url, { require_protocol: true })) {
        results.push({ original_url, error: 'Invalid URL' }); continue;
      }
      try {
        const short_code = await uniqueCode();
        const bulkRow = { user_id: req.user.userId, original_url, short_code,
                          title: item.title || null };
        if (item.tags?.length) bulkRow.tags = item.tags;
        const { data: url, error } = await supabase.from('short_urls')
          .insert(bulkRow).select('*').single();
        if (error) throw error;
        results.push({ ...url, total_clicks: 0 });
      } catch { results.push({ original_url, error: 'Failed to create' }); }
    }
    res.status(201).json({ results });
  } catch (err) {
    console.error('Bulk error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── POST /api/urls/unlock/:code  (password verification) ── */
router.post('/unlock/:code', async (req, res) => {
  const { code } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const { data: url } = await supabase.from('short_urls')
    .select('id, password_hash, original_url, ab_url, ab_split')
    .or(`short_code.eq.${code},custom_alias.eq.${code}`).single();

  if (!url || !url.password_hash) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(password, url.password_hash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });

  let destination = url.original_url;
  if (url.ab_url && Math.random() * 100 >= (url.ab_split ?? 50)) destination = url.ab_url;
  res.json({ url: destination });
});

/* ── GET /api/urls/:id/health ────────────────────────────── */
router.get('/:id/health', authenticate, async (req, res) => {
  const { data: url } = await supabase.from('short_urls')
    .select('id, user_id, original_url').eq('id', req.params.id).single();
  if (!url) return res.status(404).json({ error: 'Not found' });
  if (url.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const start = Date.now();
  try {
    await new Promise((resolve, reject) => {
      const mod = url.original_url.startsWith('https') ? https : http;
      const request = mod.request(url.original_url, { method: 'HEAD', timeout: 6000 }, (r) => {
        resolve({ statusCode: r.statusCode });
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('timeout')); });
      request.end();
    }).then(({ statusCode }) => {
      const alive = statusCode < 400;
      res.json({ alive, statusCode, responseTime: Date.now() - start });
    });
  } catch (err) {
    res.json({ alive: false, error: err.message, responseTime: Date.now() - start });
  }
});

/* ── GET /api/urls/:id/stats ─────────────────────────────── */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { data: url, error: urlErr } = await supabase
      .from('short_urls_with_stats').select('*').eq('id', req.params.id).single();
    if (urlErr || !url) return res.status(404).json({ error: 'Not found' });
    if (url.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const { data: recentClicks } = await supabase.from('url_clicks')
      .select('id, clicked_at, country, city, device_type, browser, os, referer, variant')
      .eq('short_url_id', req.params.id).order('clicked_at', { ascending: false }).limit(20);

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: allClicks } = await supabase.from('url_clicks')
      .select('clicked_at, variant').eq('short_url_id', req.params.id)
      .gte('clicked_at', thirtyDaysAgo.toISOString());

    const clicksByDay = {};
    (allClicks || []).forEach(c => {
      const day = c.clicked_at.split('T')[0];
      if (!clicksByDay[day]) clicksByDay[day] = { count: 0, a: 0, b: 0 };
      clicksByDay[day].count++;
      clicksByDay[day][c.variant || 'a']++;
    });
    const dailyClicks = Object.entries(clicksByDay)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ url, recentClicks: recentClicks || [], dailyClicks });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── PUT /api/urls/:id ───────────────────────────────────── */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('short_urls')
      .select('id, user_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['original_url','title','tags','is_public','preview_enabled',
                     'ab_url','ab_split','max_clicks','expires_at'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    if (req.body.original_url && !validator.isURL(req.body.original_url, { require_protocol: true }))
      return res.status(400).json({ error: 'Invalid URL' });
    if (req.body.password) updates.password_hash = await bcrypt.hash(req.body.password, 12);
    if (req.body.removePassword) updates.password_hash = null;

    const { data: updated, error } = await supabase.from('short_urls')
      .update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ url: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── DELETE /api/urls/:id ────────────────────────────────── */
router.delete('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('short_urls')
    .select('id, user_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  await supabase.from('short_urls').delete().eq('id', req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
