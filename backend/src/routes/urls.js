const express = require('express');
const validator = require('validator');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { generateShortCode } = require('../utils/generateCode');

const router = express.Router();

// GET /api/urls — list all URLs for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('short_urls_with_stats')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ urls: data });
  } catch (err) {
    console.error('List URLs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/urls — create a new short URL
router.post('/', authenticate, async (req, res) => {
  try {
    const { original_url, custom_alias, title, expires_at } = req.body;

    if (!original_url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!validator.isURL(original_url, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL. Please include http:// or https://' });
    }

    let short_code;

    if (custom_alias) {
      const aliasClean = custom_alias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (aliasClean.length < 3 || aliasClean.length > 30) {
        return res.status(400).json({ error: 'Custom alias must be 3–30 characters (letters, numbers, - and _)' });
      }

      const { data: existing } = await supabase
        .from('short_urls')
        .select('id')
        .or(`short_code.eq.${aliasClean},custom_alias.eq.${aliasClean}`)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'This alias is already taken' });
      }
      short_code = aliasClean;
    } else {
      let unique = false;
      while (!unique) {
        const code = generateShortCode();
        const { data } = await supabase
          .from('short_urls')
          .select('id')
          .eq('short_code', code)
          .single();
        if (!data) {
          short_code = code;
          unique = true;
        }
      }
    }

    const insertData = {
      user_id: req.user.userId,
      original_url,
      short_code,
      title: title ? title.trim() : null,
      expires_at: expires_at || null,
    };
    if (custom_alias) insertData.custom_alias = short_code;

    const { data: url, error } = await supabase
      .from('short_urls')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ url: { ...url, total_clicks: 0, last_clicked_at: null } });
  } catch (err) {
    console.error('Create URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/urls/:id — update original_url or title
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { original_url, title } = req.body;

    if (original_url && !validator.isURL(original_url, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('short_urls')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'URL not found' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const updates = {};
    if (original_url) updates.original_url = original_url;
    if (title !== undefined) updates.title = title ? title.trim() : null;

    const { data: updated, error } = await supabase
      .from('short_urls')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ url: updated });
  } catch (err) {
    console.error('Update URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/urls/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('short_urls')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'URL not found' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabase.from('short_urls').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'URL deleted successfully' });
  } catch (err) {
    console.error('Delete URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/urls/:id/stats — analytics for one URL
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: url, error: urlErr } = await supabase
      .from('short_urls_with_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (urlErr || !url) return res.status(404).json({ error: 'URL not found' });
    if (url.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    // Recent 20 clicks
    const { data: recentClicks, error: clickErr } = await supabase
      .from('url_clicks')
      .select('id, clicked_at, country, city, device_type, browser, os, referer')
      .eq('short_url_id', id)
      .order('clicked_at', { ascending: false })
      .limit(20);

    if (clickErr) throw clickErr;

    // Daily clicks for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: allClicks, error: allErr } = await supabase
      .from('url_clicks')
      .select('clicked_at')
      .eq('short_url_id', id)
      .gte('clicked_at', thirtyDaysAgo.toISOString());

    if (allErr) throw allErr;

    // Aggregate clicks per day
    const clicksByDay = {};
    (allClicks || []).forEach(click => {
      const day = click.clicked_at.split('T')[0];
      clicksByDay[day] = (clicksByDay[day] || 0) + 1;
    });

    const dailyClicks = Object.entries(clicksByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ url, recentClicks: recentClicks || [], dailyClicks });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
