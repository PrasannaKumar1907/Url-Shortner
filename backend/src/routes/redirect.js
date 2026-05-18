const express = require('express');
const supabase = require('../db');

const router = express.Router();

function parseUserAgent(ua = '') {
  let device_type = 'desktop';
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    device_type = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
  }

  let browser = 'other';
  if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'chrome';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
  else if (/edge/i.test(ua)) browser = 'edge';
  else if (/opr|opera/i.test(ua)) browser = 'opera';

  let os = 'other';
  if (/windows/i.test(ua)) os = 'windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macos';
  else if (/linux/i.test(ua)) os = 'linux';
  else if (/android/i.test(ua)) os = 'android';
  else if (/iphone|ipad/i.test(ua)) os = 'ios';

  return { device_type, browser, os };
}

// GET /:code — redirect to original URL
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: url, error } = await supabase
      .from('short_urls')
      .select('id, original_url, expires_at, is_active')
      .or(`short_code.eq.${code},custom_alias.eq.${code}`)
      .single();

    if (error || !url) {
      return res.status(404).send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem">
        <h1>404 – Short link not found</h1>
        <p>This link does not exist or has been removed.</p>
        <a href="${process.env.FRONTEND_URL}">Go to homepage</a>
        </body></html>
      `);
    }

    if (!url.is_active) {
      return res.status(410).send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem">
        <h1>410 – Link disabled</h1>
        <p>This short link has been deactivated.</p>
        </body></html>
      `);
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem">
        <h1>410 – Link expired</h1>
        <p>This short link has expired.</p>
        </body></html>
      `);
    }

    // Record analytics asynchronously
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null;
    const { device_type, browser, os } = parseUserAgent(userAgent);

    supabase.from('url_clicks').insert({
      short_url_id: url.id,
      ip_address: ip,
      user_agent: userAgent.substring(0, 512),
      referer: referer ? referer.substring(0, 512) : null,
      device_type,
      browser,
      os,
    }).then(({ error: clickErr }) => {
      if (clickErr) console.error('Click insert error:', clickErr);
    });

    res.redirect(301, url.original_url);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
