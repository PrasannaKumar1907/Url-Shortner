// Snipli Project Documentation Generator
// Run: node generate-docs.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, ExternalHyperlink, LevelFormat,
  PageBreak, TableOfContents,
} = require('C:/Users/Sachin PC/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

// ─── Helpers ────────────────────────────────────────────────────────────────

const ACCENT  = '2563EB'; // blue
const DARK    = '1E293B';
const LIGHT   = 'F8FAFC';
const BORDER  = 'E2E8F0';
const SUCCESS = '10B981';
const WARN    = 'F59E0B';
const DANGER  = 'EF4444';
const PURPLE  = '7C3AED';
const GRAY    = '64748B';

function cell(text, opts = {}) {
  const {
    bold = false, color = DARK, bg = 'FFFFFF', width = 4680,
    fontSize = 20, italic = false, wrap = true,
  } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
      left:   { style: BorderStyle.SINGLE, size: 1, color: BORDER },
      right:  { style: BorderStyle.SINGLE, size: 1, color: BORDER },
    },
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color, size: fontSize, italics: italic, font: 'Arial' })],
    })],
  });
}

function headerCell(text, width = 4680) {
  return cell(text, { bold: true, color: 'FFFFFF', bg: '1E40AF', width, fontSize: 20 });
}

function row(cells) { return new TableRow({ children: cells }); }

function tbl(headers, rows2, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows2.map(r =>
        new TableRow({
          children: r.map((t, i) => {
            const isAlt = rows2.indexOf(r) % 2 === 1;
            return cell(t, { width: colWidths[i], bg: isAlt ? 'F0F4FF' : 'FFFFFF' });
          }),
        })
      ),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 36, color: '1E40AF', font: 'Arial' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: '1E293B', font: 'Arial' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE', space: 4 } },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: ACCENT, font: 'Arial' })],
  });
}

function p(text, opts = {}) {
  const { bold = false, color = DARK, size = 22, spacing = 120, italic = false } = opts;
  return new Paragraph({
    spacing: { after: spacing },
    children: [new TextRun({ text, bold, color, size, italics: italic, font: 'Arial' })],
  });
}

function pRuns(runs, spacing = 120) {
  return new Paragraph({
    spacing: { after: spacing },
    children: runs.map(r => new TextRun({ ...r, font: 'Arial' })),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: DARK })],
  });
}

function numBullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: DARK })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { after: 60 },
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 } },
    indent: { left: 360 },
    children: [new TextRun({ text, font: 'Courier New', size: 18, color: '1E40AF' })],
  });
}

function infoBox(label, text, color = 'DBEAFE', borderColor = ACCENT) {
  return new Paragraph({
    spacing: { after: 120, before: 80 },
    shading: { fill: color, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: borderColor, space: 8 } },
    indent: { left: 240, right: 240 },
    children: [
      new TextRun({ text: label + ' ', bold: true, size: 22, font: 'Arial', color: borderColor }),
      new TextRun({ text, size: 22, font: 'Arial', color: DARK }),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { after: 160, before: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 1 } },
    children: [],
  });
}

function pgBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function empty(space = 120) {
  return new Paragraph({ spacing: { after: space }, children: [] });
}

// ─── Document Content ────────────────────────────────────────────────────────

const content = [

  // ── COVER PAGE ──────────────────────────────────────────────────────────────
  new Paragraph({
    spacing: { before: 2880, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'SNIPLI', bold: true, size: 96, color: ACCENT, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new TextRun({ text: 'URL Shortener — Full-Stack Application', size: 36, color: GRAY, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 640 },
    children: [new TextRun({ text: 'Project Documentation', size: 28, color: DARK, font: 'Arial', italics: true })],
  }),
  divider(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Technology Stack', bold: true, size: 26, color: DARK, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Frontend: React 18 + Vite + Tailwind CSS v4', size: 22, color: GRAY, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Backend: Node.js + Express.js', size: 22, color: GRAY, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Database: Supabase (PostgreSQL)', size: 22, color: GRAY, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Deployment: Vercel (Serverless)', size: 22, color: GRAY, font: 'Arial' })],
  }),
  empty(200),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Version 1.0  |  May 2026', size: 20, color: GRAY, font: 'Arial', italics: true })],
  }),
  pgBreak(),

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: 'Table of Contents', bold: true, size: 36, color: '1E40AF', font: 'Arial' })],
  }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PROJECT OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────────
  h1('1. Project Overview'),
  p('Snipli is a modern, feature-rich URL shortener built as a full-stack web application. It lets users create short, memorable links from long URLs and tracks how many people click them. Think of it like Bit.ly, but one you build yourself.', { size: 22, spacing: 160 }),
  h2('1.1 What Can Snipli Do?'),
  bullet('Shorten any long URL into a short link (e.g., snipli.app/abc1234)'),
  bullet('Track click analytics — how many clicks, from where, on which device'),
  bullet('Password-protect links so only people with the password can access them'),
  bullet('Set an expiry date — links automatically stop working after a date'),
  bullet('Limit clicks — link deactivates after reaching a maximum click count'),
  bullet('A/B Testing — split traffic between two destination URLs'),
  bullet('Preview page — show a 5-second countdown before redirecting'),
  bullet('Public bio page — a link-in-bio page for each user (like Linktree)'),
  bullet('Bulk shortener — shorten up to 50 URLs at once'),
  bullet('Tag your links and filter/search by tags'),
  bullet('Health check — test if a destination URL is still working'),
  bullet('Export all your links to a CSV file'),
  bullet('Dark mode and light mode toggle'),
  bullet('QR code generation for each short link'),
  empty(),

  h2('1.2 Project Structure'),
  p('The project is a monorepo — one Git repository with two separate folders:'),
  code('Url-Shortner/'),
  code('  backend/    ← Node.js Express API server'),
  code('  frontend/   ← React application (Vite)'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TECHNOLOGY STACK
  // ─────────────────────────────────────────────────────────────────────────────
  h1('2. Technology Stack'),

  h2('2.1 Backend Technologies'),
  tbl(
    ['Package', 'Version', 'Purpose'],
    [
      ['express', '4.x', 'Web framework — handles HTTP routes, middleware, requests/responses'],
      ['@supabase/supabase-js', '2.x', 'Official Supabase SDK to query the PostgreSQL database'],
      ['bcryptjs', '2.x', 'Hash passwords securely before storing them in the database'],
      ['jsonwebtoken', '9.x', 'Create and verify JWT tokens for user authentication'],
      ['nanoid', '3.3.7', 'Generate random 7-character short codes (a-z, A-Z, 0-9)'],
      ['express-rate-limit', '7.x', 'Prevent abuse by limiting how many requests an IP can make'],
      ['cors', '2.x', 'Allow the frontend (different origin) to call the backend'],
      ['dotenv', '16.x', 'Load secret keys from a .env file into process.env'],
      ['validator', '13.x', 'Validate email addresses and URLs before saving them'],
    ],
    [2800, 1600, 4960]
  ),
  empty(200),

  h2('2.2 Frontend Technologies'),
  tbl(
    ['Package', 'Version', 'Purpose'],
    [
      ['react', '18.x', 'Core UI library — builds the interactive user interface'],
      ['react-router-dom', '6.x', 'Client-side routing — navigate between pages without reloading'],
      ['vite', '5.x', 'Super-fast build tool and dev server for the frontend'],
      ['tailwindcss', 'v4', 'Utility-first CSS framework for styling'],
      ['axios', '1.x', 'HTTP client — makes API calls to the backend'],
      ['react-hot-toast', '2.x', 'Shows toast notifications (success/error messages)'],
      ['recharts', '2.x', 'Chart library — renders click analytics graphs'],
      ['qrcode.react', '3.x', 'Generates QR codes for short links'],
      ['lucide-react', '0.x', 'Icon library — all icons used in the UI'],
      ['date-fns', '3.x', 'Date formatting and calculation utilities'],
    ],
    [2800, 1600, 4960]
  ),
  empty(200),

  h2('2.3 Infrastructure'),
  tbl(
    ['Service', 'Role'],
    [
      ['Supabase', 'Managed PostgreSQL database with an HTTP API. Free tier available.'],
      ['Vercel', 'Hosts both frontend (static) and backend (serverless functions). Free tier available.'],
      ['Google Favicons API', 'Fetches website icons for display on the Bio page.'],
    ],
    [2400, 6960]
  ),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DATABASE DESIGN
  // ─────────────────────────────────────────────────────────────────────────────
  h1('3. Database Design'),
  p('Snipli uses Supabase which is a cloud PostgreSQL database. There are 3 tables and 1 view.'),
  infoBox('What is PostgreSQL?', 'A powerful, open-source relational database. Data is stored in rows and columns like a spreadsheet, and you use SQL to read/write data.'),
  empty(),

  h2('3.1 Table: users'),
  p('Stores account information for every registered user.'),
  tbl(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (Primary Key)', 'Unique identifier for each user — auto-generated'],
      ['email', 'TEXT (Unique)', 'User\'s email address — must be unique'],
      ['password_hash', 'TEXT', 'Hashed version of the password (never store plain text)'],
      ['name', 'TEXT', 'User\'s display name'],
      ['created_at', 'TIMESTAMPTZ', 'When the account was created'],
    ],
    [2200, 2400, 4760]
  ),
  empty(200),

  h2('3.2 Table: short_urls'),
  p('Stores every short link that users create.'),
  tbl(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (Primary Key)', 'Unique ID for the link'],
      ['user_id', 'UUID (Foreign Key)', 'Which user created this link — links to users.id'],
      ['original_url', 'TEXT', 'The full destination URL'],
      ['short_code', 'TEXT (Unique)', 'The random 7-character code (e.g., abc1234)'],
      ['custom_alias', 'TEXT (Unique)', 'Optional custom short code chosen by the user'],
      ['title', 'TEXT', 'Optional display name for the link'],
      ['expires_at', 'TIMESTAMPTZ', 'When the link stops working (optional)'],
      ['is_active', 'BOOLEAN', 'Whether the link is enabled (default: true)'],
      ['password_hash', 'TEXT', 'Hashed password for protected links (optional)'],
      ['max_clicks', 'INTEGER', 'Maximum allowed clicks before deactivating (optional)'],
      ['tags', 'TEXT[]', 'Array of tag strings for organizing links'],
      ['is_public', 'BOOLEAN', 'Whether link appears on the user\'s public bio page'],
      ['preview_enabled', 'BOOLEAN', 'Whether to show a preview page before redirecting'],
      ['ab_url', 'TEXT', 'The B destination URL for A/B testing (optional)'],
      ['ab_split', 'INTEGER', 'Percentage of traffic sent to URL A (default: 50)'],
      ['created_at', 'TIMESTAMPTZ', 'When the link was created'],
    ],
    [2200, 2200, 4960]
  ),
  empty(200),

  h2('3.3 Table: url_clicks'),
  p('Records every click on a short link for analytics.'),
  tbl(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (Primary Key)', 'Unique ID for each click event'],
      ['short_url_id', 'UUID (Foreign Key)', 'Which link was clicked — links to short_urls.id'],
      ['clicked_at', 'TIMESTAMPTZ', 'Exact timestamp of the click'],
      ['ip_address', 'TEXT', 'IP address of the visitor'],
      ['user_agent', 'TEXT', 'Browser and OS information string'],
      ['referer', 'TEXT', 'Where the visitor came from (previous page URL)'],
      ['country', 'TEXT', 'Country of the visitor'],
      ['device_type', 'TEXT', 'mobile, desktop, or tablet'],
      ['browser', 'TEXT', 'Browser name (Chrome, Firefox, etc.)'],
      ['os', 'TEXT', 'Operating system (Windows, iOS, etc.)'],
      ['variant', 'TEXT', 'A/B test variant served — \'a\' or \'b\''],
    ],
    [2200, 2200, 4960]
  ),
  empty(200),

  h2('3.4 View: short_urls_with_stats'),
  p('A database view is like a virtual table that calculates values on the fly. This view joins short_urls with url_clicks to add click counts.'),
  code('CREATE VIEW short_urls_with_stats AS'),
  code('SELECT'),
  code('  su.*,                                              -- all columns from short_urls'),
  code('  COUNT(uc.id)             AS total_clicks,         -- total click count'),
  code('  MAX(uc.clicked_at)       AS last_clicked_at,      -- most recent click'),
  code('  COUNT(...) FILTER (WHERE variant=\'a\') AS ab_clicks_a,  -- A/B variant A clicks'),
  code('  COUNT(...) FILTER (WHERE variant=\'b\') AS ab_clicks_b   -- A/B variant B clicks'),
  code('FROM short_urls su'),
  code('LEFT JOIN url_clicks uc ON uc.short_url_id = su.id'),
  code('GROUP BY su.id;'),
  infoBox('Why a View?', 'Instead of writing a complex JOIN query every time we want click counts, we query the view as if it were a regular table. Much simpler!'),
  empty(),

  h2('3.5 Database Indexes'),
  p('Indexes make database lookups faster. Without indexes, the database has to scan every row. With indexes, it jumps directly to the right rows.'),
  tbl(
    ['Index', 'Table', 'Why It Exists'],
    [
      ['idx_short_urls_user_id', 'short_urls', 'Fast lookup of all links belonging to a user'],
      ['idx_short_urls_short_code', 'short_urls', 'Fast lookup when someone visits a short URL'],
      ['idx_short_urls_custom_alias', 'short_urls', 'Fast lookup for custom alias codes'],
      ['idx_url_clicks_short_url_id', 'url_clicks', 'Fast retrieval of analytics for a link'],
      ['idx_url_clicks_clicked_at', 'url_clicks', 'Fast date-range queries for analytics graphs'],
    ],
    [3000, 2000, 4360]
  ),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. KEY CONCEPTS EXPLAINED
  // ─────────────────────────────────────────────────────────────────────────────
  h1('4. Key Concepts Explained Simply'),
  p('This section explains the important ideas behind how Snipli works, in plain language.'),

  h2('4.1 How URL Shortening Works'),
  p('When you create a short link:'),
  numBullet('The backend generates a random 7-character code using nanoid (e.g., "xK3pQ9m")'),
  numBullet('That code is saved in the database, linked to your long URL'),
  numBullet('You get back the short URL: yourdomain.com/xK3pQ9m'),
  p('When someone visits the short link:'),
  numBullet('The browser sends a GET request to the backend with the code "xK3pQ9m"'),
  numBullet('The backend looks up the code in the database'),
  numBullet('If found and active, it records a click and redirects the visitor to the original URL'),
  infoBox('HTTP 301 Redirect:', 'The browser receives a "Moved Permanently" response with the destination URL in the Location header. The browser automatically navigates there.'),
  empty(),

  h2('4.2 JWT — How Login Works'),
  p('JWT stands for JSON Web Token. It\'s a secure way to prove who you are.'),
  numBullet('You enter email and password on the login page'),
  numBullet('The backend checks the password hash. If correct, it creates a JWT token'),
  numBullet('The token is a long string like: eyJhbGc...XYZ — it contains your userId and email, signed with a secret key'),
  numBullet('The frontend stores this token in localStorage'),
  numBullet('Every API request includes the token in the header: Authorization: Bearer <token>'),
  numBullet('The backend verifies the token\'s signature before processing any protected request'),
  infoBox('Why tokens?', 'Traditional sessions require the server to remember who is logged in. Tokens are self-contained — no server-side storage needed. The server just verifies the signature.'),
  code('// Token lasts 7 days'),
  code('jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: "7d" })'),
  empty(),

  h2('4.3 Password Hashing with bcrypt'),
  p('You should NEVER store passwords as plain text. If the database is leaked, all passwords would be exposed. Snipli uses bcrypt to hash passwords.'),
  bullet('Hashing is one-way — you cannot reverse a hash to get the original password'),
  bullet('bcrypt adds a "salt" — random data that makes each hash unique, even for the same password'),
  bullet('When logging in, bcrypt.compare() hashes the entered password and checks if it matches'),
  code('// Hashing (during signup)'),
  code('const hash = await bcrypt.hash(password, 12);  // 12 = work factor (slower = more secure)'),
  code(''),
  code('// Verifying (during login)'),
  code('const match = await bcrypt.compare(enteredPassword, storedHash);'),
  empty(),

  h2('4.4 Rate Limiting'),
  p('Rate limiting prevents abuse. Without it, someone could spam your login endpoint thousands of times per second trying to guess passwords.'),
  bullet('API endpoints: max 100 requests per IP per 15 minutes (production)'),
  bullet('Auth endpoints: max 20 requests per IP per 15 minutes (production)'),
  bullet('In development mode: rate limiting is completely skipped'),
  code('// express-rate-limit configuration'),
  code('const isDev = process.env.NODE_ENV !== "production";'),
  code('const limiter = rateLimit({'),
  code('  windowMs: 15 * 60 * 1000,  // 15 minutes'),
  code('  max: 100,'),
  code('  skip: () => isDev           // bypass entirely in development'),
  code('});'),
  empty(),

  h2('4.5 CORS — Cross-Origin Resource Sharing'),
  p('The frontend runs on one domain (e.g., snipli.vercel.app) and the backend on another (snipli-api.vercel.app). Browsers block requests across different origins by default — this is a security feature called the Same-Origin Policy.'),
  p('CORS is a mechanism that tells the browser: "It\'s okay for the frontend to talk to this backend."'),
  code('// Backend tells browsers to allow requests from the frontend'),
  code('app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));'),
  empty(),

  h2('4.6 Environment Variables'),
  p('Sensitive values (API keys, database URLs, secret keys) are never hardcoded in source code. They\'re stored in environment variables — a separate .env file that is never committed to Git.'),
  tbl(
    ['Variable', 'Where Used', 'What It Is'],
    [
      ['SUPABASE_URL', 'Backend', 'Your Supabase project URL (e.g., https://abc.supabase.co)'],
      ['SUPABASE_SERVICE_KEY', 'Backend', 'Service role key — full database access (keep this secret!)'],
      ['JWT_SECRET', 'Backend', 'Secret string used to sign/verify JWT tokens'],
      ['FRONTEND_URL', 'Backend', 'Your frontend URL — for CORS whitelist'],
      ['VITE_BASE_URL', 'Frontend', 'Your backend URL — used to build API request URLs'],
    ],
    [2600, 1800, 4960]
  ),
  empty(),

  h2('4.7 React Context'),
  p('React Context is a way to share data across many components without passing props through every level of the component tree.'),
  p('Snipli has two Contexts:'),
  bullet('AuthContext — stores the logged-in user\'s information and login/logout functions'),
  bullet('ThemeContext — stores whether dark mode is on, and toggles the .dark CSS class'),
  infoBox('How it works:', 'Any component inside the Provider can call useAuth() or useTheme() to access the shared state — no prop drilling needed.'),
  empty(),

  h2('4.8 Protected Routes'),
  p('Some pages (Dashboard, Analytics) should only be accessible when logged in. ProtectedRoute is a React component that wraps these pages:'),
  numBullet('Check if a user is logged in (from AuthContext)'),
  numBullet('If yes: render the page'),
  numBullet('If no: redirect to /login'),
  code('// How it\'s used in App.jsx'),
  code('<Route path="/dashboard"'),
  code('  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />'),
  empty(),

  h2('4.9 CSS Custom Properties (Theme System)'),
  p('Instead of using Tailwind\'s dark: variant on every element, Snipli uses CSS variables (custom properties). When dark mode is toggled, the .dark class is added to <html>, which switches all variable values at once.'),
  code('/* Light theme (default) */'),
  code(':root {'),
  code('  --bg-page: #f1f5f9;'),
  code('  --text-1: #0f172a;'),
  code('}'),
  code('/* Dark theme */'),
  code('.dark {'),
  code('  --bg-page: #020617;'),
  code('  --text-1: #f1f5f9;'),
  code('}'),
  code('/* Components just use the variable */'),
  code('.card { background: var(--bg-card); }'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. BACKEND DOCUMENTATION
  // ─────────────────────────────────────────────────────────────────────────────
  h1('5. Backend Documentation'),
  p('The backend is a Node.js Express API server. It handles all business logic, database queries, and URL redirects.'),

  h2('5.1 File Structure'),
  code('backend/'),
  code('  src/'),
  code('    server.js              ← Entry point — sets up Express, middleware, routes'),
  code('    db.js                  ← Supabase client setup'),
  code('    middleware/'),
  code('      auth.js              ← JWT verification middleware'),
  code('    routes/'),
  code('      auth.js              ← /api/auth/* endpoints'),
  code('      urls.js              ← /api/urls/* endpoints'),
  code('      bio.js               ← /api/bio/* endpoints'),
  code('      redirect.js          ← /:code redirect handler'),
  code('    utils/'),
  code('      generateCode.js      ← nanoid short code generator'),
  code('  .env                     ← Environment variables (not in Git)'),
  code('  package.json'),
  code('  vercel.json              ← Vercel deployment config'),
  empty(),

  h2('5.2 server.js — Application Entry Point'),
  p('This file creates the Express app, adds middleware, registers all routes, and starts the server.'),
  tbl(
    ['Middleware / Setting', 'What It Does'],
    [
      ['app.set("trust proxy", 1)', 'Tells Express to trust the forwarding headers from Vercel\'s load balancer (needed for correct IP addresses in rate limiting)'],
      ['cors()', 'Allows the frontend domain to make API requests'],
      ['express.json()', 'Parses JSON request bodies (req.body)'],
      ['express.urlencoded()', 'Parses form data in request bodies'],
      ['apiLimiter', '100 requests per IP per 15 min on all /api/urls routes'],
      ['authLimiter', '20 requests per IP per 15 min on /api/auth routes'],
      ['module.exports = app', 'Exports the app for Vercel serverless deployment'],
      ['if (require.main === module)', 'Only starts the server in local development, not in Vercel'],
    ],
    [3200, 6160]
  ),
  empty(),

  h2('5.3 db.js — Database Client'),
  p('Creates and exports a single Supabase client instance used across all route files.'),
  code('const { createClient } = require("@supabase/supabase-js");'),
  code('const supabase = createClient('),
  code('  process.env.SUPABASE_URL,          // your project URL'),
  code('  process.env.SUPABASE_SERVICE_KEY   // service role key — bypasses RLS'),
  code(');'),
  code('module.exports = supabase;'),
  infoBox('Service Key vs Anon Key:', 'The service key bypasses Row Level Security (RLS), giving full database access. Only use this on the backend server — NEVER expose it to the frontend.'),
  empty(),

  h2('5.4 middleware/auth.js — JWT Authentication'),
  p('This middleware function runs before any protected route handler. It reads the token from the request header, verifies it, and adds the user info to the request object.'),
  code('// The header must look like:'),
  code('// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
  empty(),
  p('If the token is missing or invalid, the middleware returns a 401 Unauthorized response and the route handler never runs. If valid, it sets req.user = { userId, email } so routes can identify who made the request.'),
  empty(),

  h2('5.5 utils/generateCode.js — Short Code Generator'),
  p('Uses the nanoid library to create random, URL-safe short codes.'),
  code('const { customAlphabet } = require("nanoid");'),
  code('const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";'),
  code('const nanoid = customAlphabet(alphabet, 7);'),
  p('With 62 characters and 7 length, there are 62^7 = 3.5 trillion possible codes — effectively no collisions. The alphabet excludes special characters that could cause issues in URLs.'),
  empty(),

  h2('5.6 routes/auth.js — Authentication Endpoints'),
  empty(80),

  h3('POST /api/auth/signup'),
  p('Creates a new user account.'),
  tbl(
    ['Step', 'Action'],
    [
      ['1. Validate', 'Check name, email, password are present. Validate email format. Password must be 8+ characters.'],
      ['2. Check duplicate', 'Query database: does a user with this email already exist?'],
      ['3. Hash password', 'bcrypt.hash(password, 12) — generates a secure hash'],
      ['4. Insert user', 'INSERT into users table with email, name, password_hash'],
      ['5. Create JWT', 'Sign a 7-day token containing userId and email'],
      ['6. Respond', 'Return { token, user: { id, email, name } } with status 201'],
    ],
    [1200, 8160]
  ),
  empty(200),

  h3('POST /api/auth/login'),
  p('Authenticates an existing user.'),
  tbl(
    ['Step', 'Action'],
    [
      ['1. Validate', 'Check email and password are present. Validate email format.'],
      ['2. Find user', 'SELECT from users WHERE email = inputEmail'],
      ['3. Compare password', 'bcrypt.compare(inputPassword, user.password_hash)'],
      ['4. Create JWT', 'Sign a 7-day token on successful match'],
      ['5. Respond', 'Return { token, user } OR 401 "Invalid email or password"'],
    ],
    [1200, 8160]
  ),
  infoBox('Security Note:', 'Both wrong email and wrong password return the same error message. This prevents an attacker from knowing whether an email exists in the system.'),
  empty(200),

  h3('GET /api/auth/me'),
  p('Returns the current user\'s profile. Requires authentication (Bearer token). The backend reads userId from the verified JWT and fetches the user record.'),
  empty(),

  h2('5.7 routes/urls.js — URL Management Endpoints'),
  empty(80),

  h3('GET /api/urls'),
  p('Returns all short links created by the logged-in user, with click statistics from the short_urls_with_stats view.'),
  code('SELECT * FROM short_urls_with_stats WHERE user_id = $userId ORDER BY created_at DESC'),
  empty(),

  h3('POST /api/urls — Create Short Link'),
  p('Creates a new short link. All advanced options are optional.'),
  tbl(
    ['Field', 'Type', 'Required', 'Description'],
    [
      ['url', 'string', 'Yes', 'The long URL to shorten'],
      ['customAlias', 'string', 'No', 'Custom short code (e.g., "my-link")'],
      ['title', 'string', 'No', 'Display name for the link'],
      ['expiresAt', 'ISO string', 'No', 'Expiry date/time in UTC'],
      ['maxClicks', 'number', 'No', 'Auto-deactivate after N clicks'],
      ['password', 'string', 'No', 'Password-protect this link'],
      ['tags', 'string[]', 'No', 'Array of tag names'],
      ['isPublic', 'boolean', 'No', 'Show on bio page'],
      ['previewEnabled', 'boolean', 'No', 'Show countdown preview before redirect'],
      ['abUrl', 'string', 'No', 'Second destination URL for A/B testing'],
      ['abSplit', 'number', 'No', 'Percentage for URL A (0-100, default 50)'],
    ],
    [1800, 1400, 1400, 4760]
  ),
  empty(200),

  h3('POST /api/urls/bulk — Bulk Shortening'),
  p('Creates up to 50 short links at once. Accepts { urls: ["https://...", "https://..."] }. Processes each URL individually — failures don\'t block the rest. Returns an array of results, each with either a short_code or an error message.'),
  empty(),

  h3('GET /api/urls/:id/stats — Analytics'),
  p('Returns detailed analytics for a single link:'),
  bullet('Total clicks, unique click days'),
  bullet('Daily click counts for the last 30 days (for the area chart)'),
  bullet('Click counts by country, device type, browser, OS'),
  bullet('Most recent 20 individual click records'),
  bullet('A/B test split: ab_clicks_a and ab_clicks_b'),
  empty(),

  h3('GET /api/urls/:id/health — URL Health Check'),
  p('Sends a HEAD request to the destination URL using Node\'s built-in https module. Reports whether the URL is reachable, the HTTP status code, and the response time in milliseconds.'),
  empty(),

  h3('POST /api/urls/unlock/:code — Password Verification'),
  p('Verifies the password for a protected link. Accepts { password }. Uses bcrypt.compare() to check against the stored hash. Returns { success: true, redirectUrl } on success.'),
  empty(),

  h3('PUT /api/urls/:id — Update Link'),
  p('Updates any field of a short link. Only the owner (user_id = req.user.userId) can update their links.'),
  empty(),

  h3('DELETE /api/urls/:id — Delete Link'),
  p('Deletes a short link. Because url_clicks has ON DELETE CASCADE, all click records for this link are also automatically deleted.'),
  empty(),

  h2('5.8 routes/redirect.js — URL Redirect Handler'),
  p('This is the most important route — it handles what happens when someone visits a short link.'),
  p('The redirect flow when visiting /:code:'),
  numBullet('Look up the short_code in the database (checking the view for click counts)'),
  numBullet('If not found → 404 error page'),
  numBullet('If is_active is false → "Link inactive" page'),
  numBullet('If expires_at is set and past → "Link expired" page'),
  numBullet('If max_clicks is set and total_clicks >= max_clicks → "Link expired" page'),
  numBullet('If password_hash is set → serve Password Gate HTML page (not a redirect)'),
  numBullet('If ab_url is set → randomly pick URL A or URL B based on ab_split percentage'),
  numBullet('Record the click in url_clicks with IP, user agent, referer, variant'),
  numBullet('If preview_enabled → serve Preview countdown page (not a redirect)'),
  numBullet('Otherwise → 301 redirect to the destination URL'),
  infoBox('Password Gate:', 'A self-contained HTML page is returned. It shows a password form. When submitted, JavaScript inside the page calls POST /api/urls/unlock/:code. On success, the user is redirected.'),
  infoBox('Preview Page:', 'A self-contained HTML page with a 5-second countdown. JavaScript inside uses setTimeout() to redirect after the countdown completes.'),
  empty(),

  h2('5.9 routes/bio.js — Bio Page'),
  p('Returns public profile data for a user\'s bio page.'),
  code('GET /api/bio/:username'),
  p('Finds user by name, then fetches all links where:'),
  bullet('is_public = true'),
  bullet('is_active = true'),
  bullet('expires_at is null OR expires_at > NOW()'),
  p('Returns: { user: { name, memberSince }, links: [...] }'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. FRONTEND DOCUMENTATION
  // ─────────────────────────────────────────────────────────────────────────────
  h1('6. Frontend Documentation'),
  p('The frontend is a React single-page application (SPA) built with Vite and styled with Tailwind CSS.'),

  h2('6.1 File Structure'),
  code('frontend/'),
  code('  src/'),
  code('    App.jsx                  ← Root component — router and providers'),
  code('    main.jsx                 ← React DOM entry point'),
  code('    index.css                ← Global styles, CSS variables, utility classes'),
  code('    api/'),
  code('      axios.js               ← Axios instance with base URL and interceptors'),
  code('    context/'),
  code('      AuthContext.jsx        ← User authentication state and functions'),
  code('      ThemeContext.jsx       ← Dark/light mode toggle'),
  code('    components/'),
  code('      Navbar.jsx             ← Top navigation bar'),
  code('      ProtectedRoute.jsx     ← Guards pages from unauthenticated users'),
  code('      UrlCard.jsx            ← Displays a single short link with actions'),
  code('      CreateUrlModal.jsx     ← Modal dialog for creating new links'),
  code('      BulkShortenModal.jsx   ← Modal for bulk URL shortening'),
  code('    pages/'),
  code('      Login.jsx              ← Login page'),
  code('      Signup.jsx             ← Registration page'),
  code('      Dashboard.jsx          ← Main page with URL list and stats'),
  code('      Analytics.jsx          ← Detailed analytics for a single link'),
  code('      Bio.jsx                ← Public link-in-bio page'),
  code('  vercel.json                ← Frontend routing fix for Vercel'),
  code('  vite.config.js             ← Vite config with Tailwind plugin and dev proxy'),
  empty(),

  h2('6.2 api/axios.js — API Client'),
  p('Creates a configured Axios instance used by all components for API calls.'),
  tbl(
    ['Feature', 'Description'],
    [
      ['Base URL', 'In development: /api (proxied to localhost:5000 by Vite). In production: $VITE_BASE_URL/api'],
      ['Request interceptor', 'Automatically adds Authorization: Bearer <token> header to every request'],
      ['Response interceptor', 'On 401 Unauthorized: clears localStorage and redirects to /login'],
    ],
    [2400, 6960]
  ),
  empty(),

  h2('6.3 context/AuthContext.jsx'),
  tbl(
    ['Exported', 'Type', 'Description'],
    [
      ['user', 'Object | null', 'The logged-in user\'s { id, email, name }'],
      ['loading', 'boolean', 'True while verifying token on app startup'],
      ['login(token, user)', 'Function', 'Saves token to localStorage, sets user state'],
      ['logout()', 'Function', 'Clears token from localStorage, clears user state'],
    ],
    [2400, 1800, 5160]
  ),
  p('On startup: calls GET /api/auth/me to verify the stored token. If valid, populates user. If invalid (expired), clears the token automatically.'),
  empty(),

  h2('6.4 context/ThemeContext.jsx'),
  p('Manages dark/light mode state.'),
  bullet('Reads saved preference from localStorage on startup'),
  bullet('When isDark changes, adds or removes the .dark class from <html>'),
  bullet('CSS variables in .dark { } override the defaults, changing all colors at once'),
  bullet('Saves preference to localStorage so it persists across sessions'),
  empty(),

  h2('6.5 components/Navbar.jsx'),
  p('The sticky top navigation bar shown on all authenticated pages.'),
  bullet('App logo and name on the left'),
  bullet('Sun/Moon theme toggle button'),
  bullet('User\'s name display'),
  bullet('Logout button that calls AuthContext.logout()'),
  empty(),

  h2('6.6 components/UrlCard.jsx'),
  p('Displays a single short link in the dashboard list.'),
  tbl(
    ['Section', 'What It Shows'],
    [
      ['Short URL', 'Clickable link styled in accent color'],
      ['Feature Badges', 'Purple=Password, Cyan=A/B Test, Green=Preview, Indigo=Public, Amber=Inactive'],
      ['Title', 'Optional display name'],
      ['Original URL', 'Truncated, clickable link to the destination'],
      ['Stats Row', 'Created time ago, click count, last clicked date'],
      ['Health Indicator', 'Inline result after clicking the health check button'],
      ['Tags', 'Colored chip badges for each tag'],
      ['Action Buttons', 'Copy, Health Check, Analytics, Delete (with confirm step)'],
    ],
    [2800, 6560]
  ),
  empty(),

  h2('6.7 components/CreateUrlModal.jsx'),
  p('A modal dialog for creating new short links. Has two sections:'),
  bullet('Core fields (always visible): Long URL, Title, Custom Alias'),
  bullet('Advanced Options (collapsed by default): Expiry, Max Clicks, Password, Tags, A/B Testing, Preview Mode, Show on Bio'),
  p('The expiry datetime-local input captures a local time string. Before sending to the backend, it is converted to UTC ISO format:'),
  code('new Date(form.expires_at).toISOString()'),
  p('This is important because datetime-local inputs don\'t include timezone info — without this conversion, the time would be misinterpreted as UTC when it\'s actually local time.'),
  empty(),

  h2('6.8 components/BulkShortenModal.jsx'),
  p('A modal for shortening many URLs at once.'),
  bullet('User pastes up to 50 URLs, one per line, into a textarea'),
  bullet('Sends to POST /api/urls/bulk'),
  bullet('Shows results: green checkmark for success, red X for failure'),
  bullet('Individual copy buttons and a "Copy All" button'),
  empty(),

  h2('6.9 pages/Dashboard.jsx'),
  p('The main application page after login.'),
  tbl(
    ['Section', 'Description'],
    [
      ['Header', 'Welcome message, My Bio Page / Export CSV / Bulk Shorten / New Link buttons'],
      ['Stats Row', '3 cards: Total Links, Total Clicks, Avg Clicks per Link'],
      ['Tag Filter Chips', 'Buttons to filter the URL list by tag'],
      ['Search Bar', 'Filters URLs by URL, alias, title, or tag text'],
      ['URL List', 'Filtered list of UrlCard components'],
    ],
    [2400, 6960]
  ),
  p('CSV Export generates a CSV file in the browser (no server needed) using Blob and URL.createObjectURL().'),
  empty(),

  h2('6.10 pages/Analytics.jsx'),
  p('Detailed analytics page for a single short link. Navigated to by clicking the chart icon on a UrlCard.'),
  tbl(
    ['Chart / Section', 'Library', 'Data Shown'],
    [
      ['Area Chart', 'Recharts', 'Daily clicks over the last 30 days — shows click trend'],
      ['Device Pie Chart', 'Recharts', 'Breakdown by mobile / desktop / tablet'],
      ['Browser Pie Chart', 'Recharts', 'Chrome vs Firefox vs Safari etc.'],
      ['OS Pie Chart', 'Recharts', 'Windows vs iOS vs Android etc.'],
      ['Country Table', 'Plain HTML', 'Top countries by click count'],
      ['Recent Visits', 'Plain HTML', 'Last 20 clicks with timestamp and metadata'],
      ['A/B Stats', 'Plain HTML', 'Clicks for variant A vs variant B'],
      ['QR Code', 'qrcode.react', 'Scannable QR code for the short URL'],
    ],
    [2600, 1600, 5160]
  ),
  p('Chart colors adapt to dark/light mode using useTheme() to check isDark.'),
  empty(),

  h2('6.11 pages/Bio.jsx'),
  p('A public page (no login required) accessible at /bio/:username. Shows a user\'s profile and all their public links.'),
  bullet('Fetches data from GET /api/bio/:username'),
  bullet('Shows avatar (first letter of name), member since date, total clicks'),
  bullet('Lists all public links with favicon, title, short URL, click count, tags'),
  bullet('Copy button per link'),
  bullet('Footer CTA: "Create your own Snipli bio page →"'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. ADVANCED FEATURES
  // ─────────────────────────────────────────────────────────────────────────────
  h1('7. Advanced Features Deep Dive'),

  h2('7.1 Password Protection'),
  p('When a link has a password, the redirect flow serves an HTML page instead of redirecting. The page has a form and inline JavaScript that:'),
  numBullet('Sends the entered password to POST /api/urls/unlock/:code'),
  numBullet('Backend uses bcrypt.compare() to verify'),
  numBullet('On success: receives the original URL and does window.location = url'),
  numBullet('On failure: shows "Incorrect password" message'),
  p('This flow is entirely server-rendered HTML — no React is involved in the unlock process.'),
  empty(),

  h2('7.2 A/B Split Testing'),
  p('Allows sending different visitors to different destination URLs to test which performs better.'),
  numBullet('You set URL A (original), URL B, and a split percentage (default 50%)'),
  numBullet('On each visit, the backend generates: Math.random() * 100'),
  numBullet('If the random number < ab_split → send to URL A (variant "a")'),
  numBullet('Otherwise → send to URL B (variant "b")'),
  numBullet('The variant is recorded in url_clicks so you can compare analytics'),
  empty(),

  h2('7.3 Preview / Interstitial Page'),
  p('When preview_enabled is true, visitors see a branded page for 5 seconds before being redirected. Good for affiliate links or adding a warning before the destination.'),
  p('The preview page is plain HTML served by the backend. A countdown runs with JavaScript\'s setInterval(), and setTimeout() triggers the final redirect.'),
  empty(),

  h2('7.4 Link Health Check'),
  p('Tests whether the destination URL is still reachable. Uses Node.js\'s built-in https module to send a HEAD request (asks for headers only — no body download):'),
  numBullet('Records the time before and after the request'),
  numBullet('Returns: alive (true/false), statusCode (200, 404, etc.), responseTime (ms)'),
  numBullet('A 2xx or 3xx status code means the URL is reachable'),
  p('This runs server-side because browsers block cross-origin requests without CORS headers.'),
  empty(),

  h2('7.5 Tags System'),
  p('Tags are stored as a PostgreSQL TEXT[] (array) column. The frontend parses a comma-separated input string into an array before sending to the backend.'),
  p('Dashboard tag filtering uses JavaScript: urls.filter(u => u.tags.includes(activeTag)). No additional database query is needed — it filters the already-loaded data.'),
  empty(),

  h2('7.6 Bio / Link-in-Bio Page'),
  p('Inspired by Linktree, each user gets a public page at /bio/:name. Links appear on this page only if is_public = true and the link is active and not expired.'),
  p('The page uses Google\'s favicon service to show website icons:'),
  code('https://www.google.com/s2/favicons?domain=example.com&sz=32'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. API REFERENCE
  // ─────────────────────────────────────────────────────────────────────────────
  h1('8. Complete API Reference'),
  p('All /api/* endpoints require the Authorization: Bearer <token> header unless marked as Public.'),
  empty(80),

  h2('8.1 Authentication Endpoints'),
  tbl(
    ['Method', 'Endpoint', 'Auth', 'Description'],
    [
      ['POST', '/api/auth/signup', 'Public', 'Register a new account'],
      ['POST', '/api/auth/login', 'Public', 'Login and get a JWT token'],
      ['GET', '/api/auth/me', 'Required', 'Get current user profile'],
    ],
    [1000, 2600, 1200, 4560]
  ),
  empty(200),

  h2('8.2 URL Endpoints'),
  tbl(
    ['Method', 'Endpoint', 'Auth', 'Description'],
    [
      ['GET', '/api/urls', 'Required', 'List all your short links with stats'],
      ['POST', '/api/urls', 'Required', 'Create a new short link'],
      ['POST', '/api/urls/bulk', 'Required', 'Create up to 50 short links at once'],
      ['PUT', '/api/urls/:id', 'Required', 'Update a short link'],
      ['DELETE', '/api/urls/:id', 'Required', 'Delete a short link'],
      ['GET', '/api/urls/:id/stats', 'Required', 'Get detailed analytics for a link'],
      ['GET', '/api/urls/:id/health', 'Required', 'Check if destination URL is alive'],
      ['POST', '/api/urls/unlock/:code', 'Public', 'Verify password for a protected link'],
    ],
    [1000, 2600, 1200, 4560]
  ),
  empty(200),

  h2('8.3 Bio Endpoint'),
  tbl(
    ['Method', 'Endpoint', 'Auth', 'Description'],
    [
      ['GET', '/api/bio/:username', 'Public', 'Get public profile and links for a user'],
    ],
    [1000, 2600, 1200, 4560]
  ),
  empty(200),

  h2('8.4 Redirect Endpoint'),
  tbl(
    ['Method', 'Endpoint', 'Auth', 'Description'],
    [
      ['GET', '/:code', 'Public', 'Redirect to the original URL (or serve gate/preview page)'],
    ],
    [1000, 2600, 1200, 4560]
  ),
  empty(200),

  h2('8.5 Health Check'),
  tbl(
    ['Method', 'Endpoint', 'Auth', 'Description'],
    [
      ['GET', '/health', 'Public', 'Returns { status: "ok", timestamp } — for uptime monitoring'],
    ],
    [1000, 2600, 1200, 4560]
  ),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. SETUP GUIDE
  // ─────────────────────────────────────────────────────────────────────────────
  h1('9. Local Development Setup'),

  h2('9.1 Prerequisites'),
  bullet('Node.js v18 or higher installed'),
  bullet('A free Supabase account at supabase.com'),
  bullet('Git installed'),
  empty(),

  h2('9.2 Step 1 — Clone and Install'),
  numBullet('Clone the repository: git clone <your-repo-url>'),
  numBullet('Install backend dependencies: cd backend && npm install'),
  numBullet('Install frontend dependencies: cd ../frontend && npm install'),
  empty(),

  h2('9.3 Step 2 — Supabase Setup'),
  numBullet('Create a new project at supabase.com'),
  numBullet('Go to Settings → API — copy the Project URL and service_role secret key'),
  numBullet('Go to SQL Editor — paste and run supabase_schema.sql, then supabase_schema_v2.sql'),
  empty(),

  h2('9.4 Step 3 — Backend Environment Variables'),
  p('Create backend/.env:'),
  code('SUPABASE_URL=https://your-project.supabase.co'),
  code('SUPABASE_SERVICE_KEY=your_service_role_key_here'),
  code('JWT_SECRET=any_long_random_string_here'),
  code('FRONTEND_URL=http://localhost:5173'),
  code('NODE_ENV=development'),
  empty(),

  h2('9.5 Step 4 — Frontend Environment Variables'),
  p('Create frontend/.env:'),
  code('# Leave empty for local dev — Vite proxy handles /api routing'),
  code('VITE_BASE_URL='),
  empty(),

  h2('9.6 Step 5 — Run the App'),
  p('Terminal 1 — Backend:'),
  code('cd backend && npm run dev'),
  code('# Server starts at http://localhost:5000'),
  empty(),
  p('Terminal 2 — Frontend:'),
  code('cd frontend && npm run dev'),
  code('# App opens at http://localhost:5173'),
  infoBox('Dev Proxy:', 'Vite automatically forwards all /api requests from localhost:5173 to localhost:5000. You don\'t need to specify the backend URL in the frontend.'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. DEPLOYMENT GUIDE
  // ─────────────────────────────────────────────────────────────────────────────
  h1('10. Deployment Guide (Vercel)'),
  p('Both the frontend and backend are deployed to Vercel from the same Git repository (monorepo). You create two separate Vercel projects, each pointing to a different folder.'),

  h2('10.1 Deploy Backend'),
  numBullet('Go to vercel.com → Add New Project → Import your Git repo'),
  numBullet('Set Root Directory to: backend'),
  numBullet('Framework Preset: Other'),
  numBullet('Add Environment Variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, FRONTEND_URL (your frontend Vercel URL), NODE_ENV=production'),
  numBullet('Deploy — note the URL assigned (e.g., snipli-api.vercel.app)'),
  empty(),

  h2('10.2 Deploy Frontend'),
  numBullet('Go to vercel.com → Add New Project → Import the same Git repo again'),
  numBullet('Set Root Directory to: frontend'),
  numBullet('Framework Preset: Vite'),
  numBullet('Add Environment Variable: VITE_BASE_URL = your backend URL (e.g., https://snipli-api.vercel.app)'),
  numBullet('Deploy — note the frontend URL'),
  empty(),

  h2('10.3 Update CORS'),
  p('Go back to your backend Vercel project → Settings → Environment Variables. Update FRONTEND_URL to your actual frontend Vercel URL. Then redeploy the backend.'),
  empty(),

  h2('10.4 How the Backend Works as Serverless'),
  p('Vercel converts the Express app into a serverless function. Key changes made to support this:'),
  tbl(
    ['Change', 'Why'],
    [
      ['module.exports = app', 'Vercel imports the app as a module — it manages the server, not you'],
      ['if (require.main === module) { app.listen() }', 'Only start the server in local dev — Vercel handles listening in production'],
      ['vercel.json routes: [{ src: "/(.*)", dest: "src/server.js" }]', 'Tells Vercel to send ALL requests to our Express app'],
    ],
    [3600, 5760]
  ),
  empty(),

  h2('10.5 Frontend Routing Fix'),
  p('Vercel serves the frontend as a static site. When a user refreshes on a page like /dashboard, Vercel looks for a file at /dashboard/index.html — which doesn\'t exist.'),
  p('frontend/vercel.json fixes this by rewriting all requests to index.html (letting React Router handle routing):'),
  code('{ "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }] }'),
  p('The (?!assets/) exception prevents static assets (JS, CSS files) from being incorrectly rewritten.'),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. COMMON ISSUES & SOLUTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  h1('11. Common Issues & Solutions'),
  tbl(
    ['Issue', 'Cause', 'Solution'],
    [
      ['Too many auth attempts error', 'Rate limiter triggered in development', 'Set NODE_ENV=development in .env to skip rate limiting'],
      ['Blank page after login in production', 'API calls going to frontend URL instead of backend', 'Set VITE_BASE_URL to the backend URL in frontend env vars'],
      ['Page not found on refresh (production)', 'Vercel tries to find a static file for the route', 'Add vercel.json with rewrite rule to frontend folder'],
      ['Expiry time is wrong (off by hours)', 'datetime-local input gives local time, sent as-is to backend', 'Convert with new Date(value).toISOString() before sending'],
      ['CORS errors in production', 'Backend FRONTEND_URL env var not updated', 'Update FRONTEND_URL in backend Vercel env vars to actual frontend URL'],
      ['Short codes collide', 'Two users generate the same 7-char code (extremely rare)', 'Backend checks if code exists before inserting and retries'],
    ],
    [2400, 2800, 4160]
  ),
  empty(),
  pgBreak(),

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. GLOSSARY
  // ─────────────────────────────────────────────────────────────────────────────
  h1('12. Glossary'),
  tbl(
    ['Term', 'Simple Explanation'],
    [
      ['API', 'Application Programming Interface — a set of URLs the frontend calls to get/save data'],
      ['JWT', 'JSON Web Token — a secure string that proves you\'re logged in, without server-side sessions'],
      ['bcrypt', 'A password hashing algorithm — turns your password into a scrambled string that can\'t be reversed'],
      ['Supabase', 'A cloud database service built on PostgreSQL — like Firebase but open-source'],
      ['Serverless', 'Code that runs in the cloud without managing a dedicated server — scales automatically'],
      ['SPA', 'Single Page Application — one HTML file, React updates the UI without full page reloads'],
      ['CORS', 'Cross-Origin Resource Sharing — a browser security rule that controls which websites can call your API'],
      ['nanoid', 'A library that generates random URL-safe strings — used for short codes'],
      ['Rate Limiting', 'Blocking too many requests from one IP address — prevents abuse and brute-force attacks'],
      ['Middleware', 'Functions that run before route handlers — e.g., checking if the user is logged in'],
      ['Environment Variable', 'A setting stored outside code — keeps secrets like API keys out of source code'],
      ['UUID', 'Universally Unique Identifier — a random ID like "550e8400-e29b-41d4-a716-446655440000"'],
      ['Foreign Key', 'A column that links to a row in another table — enforces data relationships'],
      ['CSS Variable', 'A reusable value in CSS (e.g., --accent: blue) that can be changed once to update everywhere'],
      ['301 Redirect', 'HTTP response telling the browser to go to a different URL permanently'],
      ['HEAD Request', 'Like GET but asks for headers only — used in health checks to avoid downloading the full page'],
      ['View (Database)', 'A saved SQL query that acts like a virtual table — simplifies complex queries'],
    ],
    [2200, 7160]
  ),
];

// ─── Build Document ──────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 280 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '1E40AF' },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '1E293B' },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2563EB' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
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
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 4 } },
          children: [
            new TextRun({ text: 'Snipli — URL Shortener Documentation', size: 18, color: GRAY, font: 'Arial' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 4 } },
          children: [
            new TextRun({ text: 'Page ', size: 18, color: GRAY, font: 'Arial' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: 'Arial' }),
            new TextRun({ text: ' of ', size: 18, color: GRAY, font: 'Arial' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: 'Arial' }),
          ],
        })],
      }),
    },
    children: content,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = 'D:/Url-Shortner/Snipli-Documentation.docx';
  fs.writeFileSync(outPath, buf);
  console.log('✅ Documentation created:', outPath);
  console.log('   Size:', (buf.length / 1024).toFixed(1), 'KB');
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
