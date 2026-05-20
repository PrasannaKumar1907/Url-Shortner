const express  = require('express');
const supabase = require('../db');

const router = express.Router();

// GET /api/bio/:username  — public profile + public links
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Try exact match first, then case-insensitive fallback
    let user = null;

    const { data: exact } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('name', username)
      .maybeSingle();

    if (exact) {
      user = exact;
    } else {
      // Case-insensitive fallback — fetch all and find best match in JS
      const { data: all } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .ilike('name', username);
      user = all?.find(u => u.name.toLowerCase() === username.toLowerCase()) || null;
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch public links — gracefully handle if v2 columns (is_public, tags) don't exist yet
    let links = [];
    try {
      const { data } = await supabase
        .from('short_urls_with_stats')
        .select('id, short_code, original_url, title, tags, total_clicks, created_at, expires_at')
        .eq('user_id', user.id)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      links = (data || []).filter(l => !l.expires_at || new Date(l.expires_at) > new Date());
    } catch {
      // v2 schema not yet applied — return empty links instead of crashing
      links = [];
    }

    res.json({
      user: { name: user.name, memberSince: user.created_at },
      links,
    });
  } catch (err) {
    console.error('Bio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
