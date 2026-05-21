const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, TabStopType, TabStopPosition,
} = require('C:/Users/Sachin PC/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

/* ── helpers ──────────────────────────────────────────── */
const ORANGE  = 'EE6123';
const DARK    = '111827';
const GRAY    = '6B7280';
const LIGHT   = 'F3F4F6';
const WHITE   = 'FFFFFF';
const border  = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function gap(n = 1) {
  return Array.from({ length: n }, () =>
    new Paragraph({ children: [new TextRun('')], spacing: { after: 0 } })
  );
}

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: WHITE, font: 'Arial' })],
    shading:  { fill: DARK, type: ShadingType.CLEAR },
    spacing:  { before: 280, after: 160 },
    indent:   { left: 200, right: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE },
    },
  });
}

function sceneHeader(number, title, timing) {
  return new Paragraph({
    children: [
      new TextRun({ text: `SCENE ${number}  `, bold: true, size: 22, color: WHITE, font: 'Arial' }),
      new TextRun({ text: `${title}`, bold: true, size: 22, color: 'FED7AA', font: 'Arial' }),
      new TextRun({ text: `   ${timing}`, size: 18, color: '9CA3AF', font: 'Arial' }),
    ],
    shading:  { fill: '1F2937', type: ShadingType.CLEAR },
    spacing:  { before: 240, after: 120 },
    indent:   { left: 180, right: 180 },
  });
}

function showLine(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '👁  SHOW: ', bold: true, size: 18, color: ORANGE, font: 'Arial' }),
      new TextRun({ text, size: 18, color: '374151', font: 'Arial', italics: true }),
    ],
    spacing: { before: 100, after: 60 },
    indent:  { left: 360 },
  });
}

function speakLine(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '🎙  SAY: ', bold: true, size: 18, color: '1D4ED8', font: 'Arial' }),
      new TextRun({ text: `"${text}"`, size: 19, color: DARK, font: 'Arial' }),
    ],
    spacing: { before: 60, after: 100 },
    indent:  { left: 360 },
  });
}

function bullet(text, color = DARK) {
  return new Paragraph({
    children: [
      new TextRun({ text: '•  ', bold: true, size: 18, color: ORANGE, font: 'Arial' }),
      new TextRun({ text, size: 18, color, font: 'Arial' }),
    ],
    spacing: { before: 50, after: 50 },
    indent:  { left: 520, hanging: 160 },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 4 } },
    spacing: { before: 120, after: 120 },
    children: [new TextRun('')],
  });
}

function tipBox(lines) {
  const rows = lines.map(line =>
    new TableRow({
      children: [
        new TableCell({
          borders: noBorder,
          shading: { fill: 'FFF7ED', type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 160, right: 160 },
          children: [new Paragraph({
            children: [new TextRun({ text: `💡  ${line}`, size: 17, color: '92400E', font: 'Arial' })],
            spacing: { before: 40, after: 40 },
          })],
        }),
      ],
    })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: ORANGE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: ORANGE },
      left:   { style: BorderStyle.SINGLE, size: 4, color: ORANGE },
      right:  { style: BorderStyle.SINGLE, size: 4, color: ORANGE },
      insideH: noBorder.top, insideV: noBorder.top,
    },
    rows,
  });
}

function quickRefTable() {
  const headerCellStyle = (text) => new TableCell({
    borders,
    shading: { fill: DARK, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: 'Arial' })],
    })],
  });

  const dataRow = (scene, show, time, highlight = false) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          shading: { fill: highlight ? 'FFF7ED' : WHITE, type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: scene, bold: true, size: 17, color: ORANGE, font: 'Arial' })],
          })],
        }),
        new TableCell({
          borders,
          shading: { fill: highlight ? 'FFF7ED' : WHITE, type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: show, size: 17, color: DARK, font: 'Arial' })],
          })],
        }),
        new TableCell({
          borders,
          shading: { fill: highlight ? 'FFF7ED' : WHITE, type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: time, bold: highlight, size: 17, color: highlight ? ORANGE : GRAY, font: 'Arial' })],
          })],
        }),
      ],
    });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 6000, 1760],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCellStyle('Scene'),
          headerCellStyle('What to Show'),
          headerCellStyle('Time'),
        ],
      }),
      dataRow('1', 'Intro — project name & purpose', '~0:25'),
      dataRow('2', 'Vercel deployment + Supabase tables', '~0:35'),
      dataRow('3', 'Signup/Login → Dashboard (JWT auth)', '~0:40'),
      dataRow('4', 'Dashboard stats, search, tag filters', '~0:40'),
      dataRow('5', 'Create link (all advanced options) + redirect', '~1:10'),
      dataRow('6', 'Analytics page — chart, breakdown, table', '~1:00'),
      dataRow('7', 'QR, Health check, Bulk, CSV, Bio page', '~0:45'),
      dataRow('8', 'Wrap-up & tech stack mention', '~0:15', true),
      dataRow('TOTAL', '', '≈ 5:30', true),
    ],
  });
}

/* ── document ─────────────────────────────────────────── */
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 20 } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'SNIPLI  —  Demo Video Script', bold: true, size: 18, color: WHITE, font: 'Arial' }),
              new TextRun({ text: '\t Katomaran Hackathon  |  5–6 Minutes', size: 16, color: '9CA3AF', font: 'Arial' }),
            ],
            shading: { fill: DARK, type: ShadingType.CLEAR },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            indent: { left: 160, right: 160 },
            spacing: { before: 80, after: 80 },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 16, color: GRAY, font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY, font: 'Arial' }),
              new TextRun({ text: '  ·  This project is a part of a hackathon run by katomaran.com', size: 16, color: GRAY, font: 'Arial' }),
            ],
            spacing: { before: 80 },
          }),
        ],
      }),
    },
    children: [

      /* ══ COVER ══ */
      ...gap(1),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'SNIPLI', bold: true, size: 72, color: ORANGE, font: 'Arial' })],
        spacing: { before: 240, after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Demo Video Script', size: 32, color: DARK, font: 'Arial' })],
        spacing: { after: 60 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Katomaran Hackathon  ·  5–6 Minutes  ·  Full Feature Walkthrough', size: 20, color: GRAY, font: 'Arial', italics: true })],
        spacing: { after: 360 },
      }),
      divider(),

      /* ══ HOW TO USE THIS DOCUMENT ══ */
      ...gap(1),
      new Paragraph({
        children: [new TextRun({ text: 'How to Use This Script', bold: true, size: 26, color: DARK, font: 'Arial' })],
        spacing: { before: 200, after: 120 },
      }),
      bullet('👁  SHOW  =  What to have on screen at that moment'),
      bullet('🎙  SAY  =  Speak this out loud (naturally, not word for word)'),
      bullet('Keep the script open on a second monitor or phone while recording'),
      bullet('Don\'t read verbatim — use it as a guide and speak naturally'),
      ...gap(1),
      divider(),

      /* ══ SCENES ══ */

      /* Scene 1 */
      heading1('SCENE 1   —   INTRO'),
      sceneHeader(1, 'Introduction', '0:00 – 0:25  (~25 sec)'),
      showLine('Browser open on the Snipli live URL — tab shows "Snipli — URL Shortener" favicon and title'),
      speakLine('Hi, I\'m [Your Name]. This is Snipli — a full-stack URL shortener I built for the Katomaran Hackathon.'),
      speakLine('Snipli solves a real problem — long, ugly URLs. You paste a long link, Snipli gives you a short one, tracks every click, and shows you exactly who clicked, when, and from where.'),
      speakLine('Let me walk you through it — live, end to end.'),
      ...gap(1),

      /* Scene 2 */
      heading1('SCENE 2   —   DEPLOYMENT'),
      sceneHeader(2, 'Vercel + Supabase', '0:25 – 1:00  (~35 sec)'),
      showLine('Open Vercel dashboard → click your Snipli project → show "Ready" green status and the live domain'),
      speakLine('The frontend is deployed on Vercel — live and accessible right now on a public URL.'),
      showLine('Switch tab to Supabase → open your project → Table Editor → click the "urls" table → show rows → then click "clicks" table → show rows'),
      speakLine('The backend connects to a Supabase PostgreSQL database. Here you can see real URL records and the clicks table — every single visit is stored here with a timestamp, device, browser, and OS.'),
      speakLine('No mock data. Everything you\'re about to see is real.'),
      ...gap(1),

      /* Scene 3 */
      heading1('SCENE 3   —   AUTHENTICATION'),
      sceneHeader(3, 'Signup / Login → Protected Dashboard', '1:00 – 1:40  (~40 sec)'),
      showLine('Navigate to the live site URL — the Signup/Login page appears (two-column design: dark left panel, form on right)'),
      speakLine('The app is fully protected. Anyone who visits gets the login page — no direct access to the dashboard.'),
      speakLine('Authentication uses JSON Web Tokens. Passwords are hashed with bcrypt — never stored in plain text. Each user can only see and manage their own links.'),
      showLine('Log in with your credentials → watch it redirect to the Dashboard'),
      speakLine('After login, the JWT is stored and sent with every API request — so the server knows exactly who you are.'),
      ...gap(1),

      /* Scene 4 */
      heading1('SCENE 4   —   DASHBOARD'),
      sceneHeader(4, 'Dashboard Overview', '1:40 – 2:20  (~40 sec)'),
      showLine('Dashboard fully loaded — scroll slowly to show stat cards at top, then link cards below'),
      speakLine('The dashboard gives you an instant summary — total links, total clicks across all your links, and the average clicks per link.'),
      showLine('Point at a link card — highlight the short URL badge, original URL, creation time, click count, and feature badges'),
      speakLine('Each link card shows the short URL, where it points, how long ago it was created, and the live click count. Badges tell you if the link is password-protected, has an expiry, or is running an A/B test.'),
      showLine('Type something in the search bar → results filter instantly'),
      speakLine('Search works across titles, URLs, and tags — filtering happens instantly on every keystroke.'),
      showLine('Click a tag chip to filter by tag'),
      speakLine('And you can organise links with tags and filter to just the ones you need.'),
      ...gap(1),

      /* Scene 5 */
      heading1('SCENE 5   —   CREATE A SHORT LINK'),
      sceneHeader(5, 'Full Link Creation Flow + Redirect', '2:20 – 3:30  (~1 min 10 sec)'),
      showLine('Click "Create Link" button → modal slides open'),
      speakLine('Let me create a link live.'),
      showLine('Paste a long URL into the URL field (e.g. a long YouTube or GitHub URL)'),
      speakLine('I paste the long URL here — Snipli validates it in real time before even letting you submit.'),
      showLine('Type a title. Then click "Advanced Options" to expand the section.'),
      speakLine('I\'ll add a title — and now let me open Advanced Options to show what makes Snipli more than just a basic shortener.'),
      showLine('Point at each field as you mention it: custom alias → expiry date → max clicks → password → tags → A/B URL + slider'),
      speakLine('Custom alias — I can make the short URL say exactly what I want instead of a random code.'),
      speakLine('Expiry date — the link automatically stops working after this date.'),
      speakLine('Max clicks — I can limit it to, say, one-time use or a hundred clicks.'),
      speakLine('Password protection — visitors have to enter a password before they get redirected.'),
      speakLine('Tags for organisation — and A/B split testing, where I give it a second destination URL and set the traffic split percentage.'),
      showLine('Submit the form → green toast appears → new link card appears at top of dashboard'),
      speakLine('Hit Create — the short link is generated instantly and appears in the dashboard.'),
      showLine('Click the copy icon on the new card → open a new browser tab → paste the URL → press Enter → it redirects'),
      speakLine('Copy it, open a new tab, paste it — and it redirects immediately. The server handles the redirect and records the click in the background.'),
      ...gap(1),

      /* Scene 6 */
      heading1('SCENE 6   —   ANALYTICS'),
      sceneHeader(6, 'Full Analytics Page Walkthrough', '3:30 – 4:30  (~1 min)'),
      showLine('Click the bar-chart icon on any link card → Analytics page loads'),
      speakLine('Every single link has its own dedicated analytics page.'),
      showLine('Point at the four stat cards one by one'),
      speakLine('At the top — total clicks of all time. Clicks in the last 30 days with the daily average. How many days the link has been active. And exactly when it was last clicked — down to the minute.'),
      showLine('Scroll to the area chart → pause on it'),
      speakLine('The click activity chart shows the full 30-day trend. You can immediately spot spikes — like when you shared the link somewhere.'),
      showLine('Scroll to the three breakdown cards: Devices, Browsers, OS'),
      speakLine('Below that — device breakdown, browser breakdown, and operating system breakdown. Each row shows the count and the percentage as an animated bar.'),
      speakLine('This data comes from the user-agent string captured on every single click — stored in the database and aggregated here in real time.'),
      showLine('Scroll to the Recent Visits table — point at a row'),
      speakLine('And the recent visits table gives a full timestamped log — every visit with device, browser, OS, country, and referrer. You can see where traffic is coming from.'),
      ...gap(1),

      /* Scene 7 */
      heading1('SCENE 7   —   BONUS FEATURES'),
      sceneHeader(7, 'Rapid-Fire Bonus Feature Demo', '4:30 – 5:15  (~45 sec)'),
      showLine('On a link card, click the QR Code button → QR code appears inline'),
      speakLine('Every link has a QR code generated instantly — scannable, ready for print or sharing.'),
      showLine('Click the wifi/health icon on a card → health result shows: status code and response time'),
      speakLine('Health check — Snipli pings the destination URL and tells you if it\'s reachable and how fast it responds. Useful for catching broken links.'),
      showLine('Click the Bulk button → modal opens → paste 3 or 4 URLs → click Shorten All → results appear'),
      speakLine('Bulk shortening — paste up to 50 URLs at once and Snipli processes them all in a single request. Great for campaigns.'),
      showLine('Click Export CSV → file downloads'),
      speakLine('Export your entire link library as a CSV — with click counts, tags, expiry dates, everything included.'),
      showLine('Navigate to the Bio Page from the sidebar → public bio page loads'),
      speakLine('And finally — a public bio page. Any link marked as public appears here — a shareable link-in-bio page anyone can visit without logging in.'),
      ...gap(1),

      /* Scene 8 */
      heading1('SCENE 8   —   WRAP-UP'),
      sceneHeader(8, 'Summary & Close', '5:15 – 5:30  (~15 sec)'),
      showLine('Back to the Dashboard — full view with multiple links'),
      speakLine('Snipli covers every mandatory feature in the problem statement — authentication, URL shortening, dashboard management, and click analytics — plus seven bonus features: custom aliases, QR codes, expiry dates, device analytics, click trend charts, bulk shortening, and a public bio page.'),
      speakLine('Built with React, Node.js, Express, and Supabase PostgreSQL — fully deployed on Vercel.'),
      speakLine('This project is a part of a hackathon run by katomaran.com. Thank you.'),
      ...gap(1),

      /* ══ QUICK REFERENCE TABLE ══ */
      divider(),
      new Paragraph({
        children: [new TextRun({ text: 'Quick Reference — Scene Timeline', bold: true, size: 26, color: DARK, font: 'Arial' })],
        spacing: { before: 200, after: 140 },
      }),
      quickRefTable(),
      ...gap(2),

      /* ══ PRO TIPS ══ */
      divider(),
      new Paragraph({
        children: [new TextRun({ text: 'Before You Record — Checklist', bold: true, size: 26, color: DARK, font: 'Arial' })],
        spacing: { before: 200, after: 140 },
      }),
      tipBox([
        'Have 3–4 links already in your dashboard with real clicks so charts show data',
        'Copy a long URL ready to paste during Scene 5 (YouTube or GitHub link works well)',
        'Pre-open Vercel and Supabase in separate tabs before starting the recording',
        'Record at 1080p — move the mouse slowly and deliberately, no rushed clicks',
        'Keep this script open on your phone or a second monitor while recording',
        'Speak calmly — the analytics section (Scene 6) is your strongest, don\'t rush it',
        'Loom free plan: up to 5 min. Use YouTube unlisted if you need the full 6 minutes',
      ]),
      ...gap(2),

    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('D:\\Url-Shortner\\Snipli-Video-Script.docx', buffer);
  console.log('Done → Snipli-Video-Script.docx');
});
