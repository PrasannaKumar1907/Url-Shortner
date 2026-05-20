const express = require('express');
const bcrypt  = require('bcryptjs');
const supabase = require('../db');

const router = express.Router();

/* ── helpers ──────────────────────────────────────────────── */
function parseUA(ua = '') {
  const device = /tablet|ipad/i.test(ua) ? 'tablet' : /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
  const browser =
    /edg/i.test(ua)    ? 'edge'    :
    /opr|opera/i.test(ua) ? 'opera' :
    /chrome/i.test(ua) ? 'chrome'  :
    /firefox/i.test(ua)? 'firefox' :
    /safari/i.test(ua) ? 'safari'  : 'other';
  const os =
    /android/i.test(ua)       ? 'android' :
    /iphone|ipad/i.test(ua)   ? 'ios'     :
    /windows/i.test(ua)       ? 'windows' :
    /mac os/i.test(ua)        ? 'macos'   :
    /linux/i.test(ua)         ? 'linux'   : 'other';
  return { device_type: device, browser, os };
}

async function recordClick(short_url_id, req, variant = 'a') {
  const ua      = (req.headers['user-agent'] || '').substring(0, 512);
  const referer = (req.headers['referer'] || req.headers['referrer'] || '').substring(0, 512) || null;
  const ip      = (req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket?.remoteAddress ?? null);
  const { device_type, browser, os } = parseUA(ua);
  await supabase.from('url_clicks').insert({ short_url_id, ip_address: ip, user_agent: ua, referer, device_type, browser, os, variant });
}

const gone = (res, msg) => res.status(410).send(page('Link Unavailable', `
  <div class="icon">🔗</div>
  <h1>${msg}</h1>
  <p>This short link is no longer available.</p>
  <a href="${process.env.FRONTEND_URL}" class="btn">Go to Snipli</a>
`));

const notFound = (res) => res.status(404).send(page('Not Found', `
  <div class="icon">🔍</div>
  <h1>Link not found</h1>
  <p>This short link does not exist or has been removed.</p>
  <a href="${process.env.FRONTEND_URL}" class="btn">Go to Snipli</a>
`));

/* ── shared HTML shell ───────────────────────────────────── */
function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} – Snipli</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
  .card{background:#fff;border-radius:16px;padding:40px 32px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.1);text-align:center}
  .logo{font-size:22px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:24px;display:block}
  .icon{font-size:48px;margin-bottom:16px}
  h1{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px}
  p{color:#64748b;font-size:15px;line-height:1.5;margin-bottom:20px}
  .btn{display:inline-block;padding:11px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:none;cursor:pointer;transition:.15s}
  .btn:hover{opacity:.88}
  input[type=password]{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;margin-bottom:12px;outline:none;color:#0f172a;background:#f8fafc;transition:.2s}
  input[type=password]:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
  .err{color:#ef4444;font-size:13px;margin:-4px 0 10px}
  .tag{display:inline-block;padding:3px 10px;background:#f1f5f9;border-radius:20px;font-size:12px;color:#475569;margin:2px}
  .dest{word-break:break-all;font-size:13px;color:#6366f1;margin-bottom:16px;background:#f1f5f9;padding:8px 12px;border-radius:8px}
  .countdown{font-size:48px;font-weight:800;color:#6366f1;margin:12px 0}
  .progress{height:4px;background:#e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:20px}
  .progress-bar{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width 1s linear}
</style>
</head><body><div class="card">
<span class="logo">Snipli</span>
${body}
</div></body></html>`;
}

/* ── password gate page ──────────────────────────────────── */
function passwordGatePage(code, title) {
  return page('Protected Link', `
  <div class="icon">🔒</div>
  <h1>Password Protected</h1>
  <p>${title ? `<strong>${title}</strong><br><br>` : ''}This link requires a password to access.</p>
  <input type="password" id="pw" placeholder="Enter password" autofocus />
  <div class="err" id="err"></div>
  <button class="btn" id="btn" onclick="unlock()">Unlock →</button>
  <script>
    document.getElementById('pw').addEventListener('keydown', e => { if (e.key==='Enter') unlock(); });
    async function unlock(){
      const pw = document.getElementById('pw').value;
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      if(!pw){ err.textContent='Please enter a password'; return; }
      btn.textContent='Checking…'; btn.disabled=true;
      try{
        const r = await fetch('/api/urls/unlock/${code}', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
        const d = await r.json();
        if(r.ok){ window.location.href = d.url; }
        else{ err.textContent = d.error || 'Incorrect password'; btn.textContent='Unlock →'; btn.disabled=false; }
      }catch{ err.textContent='Something went wrong'; btn.textContent='Unlock →'; btn.disabled=false; }
    }
  </script>`);
}

/* ── preview / interstitial page ────────────────────────── */
function previewPage(originalUrl, title) {
  const host = (() => { try { return new URL(originalUrl).hostname; } catch { return originalUrl; } })();
  return page('You are being redirected', `
  <div class="icon">🚀</div>
  <h1>${title || 'Redirecting…'}</h1>
  <p>You are about to visit:</p>
  <div class="dest">${originalUrl}</div>
  <p style="font-size:13px;color:#94a3b8;margin-bottom:8px">Redirecting in</p>
  <div class="countdown" id="ct">5</div>
  <div class="progress"><div class="progress-bar" id="pb" style="width:100%"></div></div>
  <a href="${originalUrl}" class="btn">Continue now →</a>
  <script>
    let t=5;
    const ct=document.getElementById('ct');
    const pb=document.getElementById('pb');
    const iv=setInterval(()=>{
      t--;
      ct.textContent=t;
      pb.style.width=(t/5*100)+'%';
      if(t<=0){ clearInterval(iv); window.location.href='${originalUrl.replace(/'/g,"\\'")}'; }
    },1000);
  </script>`);
}

/* ── main redirect handler ───────────────────────────────── */
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  // skip API / static routes
  if (['api','health','bio','favicon.ico'].includes(code)) return res.status(404).json({ error: 'Not found' });

  try {
    const { data: url, error } = await supabase
      .from('short_urls_with_stats')
      .select('*')
      .or(`short_code.eq.${code},custom_alias.eq.${code}`)
      .single();

    if (error || !url) return notFound(res);
    if (!url.is_active) return gone(res, 'Link disabled');
    if (url.expires_at && new Date(url.expires_at) < new Date()) return gone(res, 'Link expired');
    if (url.max_clicks && Number(url.total_clicks) >= url.max_clicks) return gone(res, 'Click limit reached');

    // password gate
    if (url.password_hash) return res.send(passwordGatePage(code, url.title));

    // pick destination (A/B split)
    let destination = url.original_url;
    let variant = 'a';
    if (url.ab_url) {
      const roll = Math.random() * 100;
      if (roll >= (url.ab_split ?? 50)) { destination = url.ab_url; variant = 'b'; }
    }

    // async click record
    recordClick(url.id, req, variant).catch(console.error);

    // preview interstitial
    if (url.preview_enabled) return res.send(previewPage(destination, url.title));

    res.redirect(301, destination);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Internal server error');
  }
});

/* ── password unlock endpoint ───────────────────────────── */
router.post('/api/urls/unlock/:code', async (req, res) => {
  const { code } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const { data: url } = await supabase
    .from('short_urls')
    .select('id, password_hash, original_url, ab_url, ab_split, preview_enabled, expires_at, is_active, max_clicks')
    .or(`short_code.eq.${code},custom_alias.eq.${code}`)
    .single();

  if (!url) return res.status(404).json({ error: 'Not found' });

  const match = await bcrypt.compare(password, url.password_hash);
  if (!match) return res.status(401).json({ error: 'Incorrect password' });

  // pick A/B destination
  let destination = url.original_url;
  let variant = 'a';
  if (url.ab_url) {
    if (Math.random() * 100 >= (url.ab_split ?? 50)) { destination = url.ab_url; variant = 'b'; }
  }

  recordClick(url.id, req, variant).catch(console.error);
  res.json({ url: destination });
});

module.exports = router;
