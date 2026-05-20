import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Copy, Check, MousePointer, Clock,
  Calendar, Globe, Smartphone, Monitor, ExternalLink,
  TrendingUp, Activity, Link2, QrCode,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const BASE_URL   = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');
const PALETTE    = ['#EE6123', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

/* ── helpers ─────────────────────────────────────────────── */
function aggregate(clicks, field) {
  const counts = {};
  clicks.forEach(c => { const k = c[field] || 'Unknown'; counts[k] = (counts[k] || 0) + 1; });
  const total = clicks.length || 1;
  return Object.entries(counts)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/* ── sub-components ──────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {label}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.5px' }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 5 }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({ title, data, icon: Icon }) {
  if (!data.length) return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={15} style={{ color: 'var(--text-3)' }} />}{title}
      </p>
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>No data yet</div>
    </div>
  );

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={15} style={{ color: 'var(--text-3)' }} />}{title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.slice(0, 5).map(({ name, value, pct }, i) => (
          <div key={name}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: PALETTE[i % PALETTE.length], flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{value}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: PALETTE[i % PALETTE.length], minWidth: 32, textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: PALETTE[i % PALETTE.length],
                borderRadius: 4,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* custom tooltip for area chart */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ color: '#EE6123', fontWeight: 700, fontSize: 16 }}>
        {payload[0].value} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>clicks</span>
      </p>
    </div>
  );
}

/* ── main page ────────────────────────────────────────────── */
export default function Analytics() {
  const { id }     = useParams();
  const { isDark } = useTheme();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [showQR, setShowQR]   = useState(false);

  useEffect(() => {
    api.get(`/urls/${id}/stats`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(`${BASE_URL}/${data.url.short_code}`);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const gridColor  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const tickColor  = isDark ? '#475569' : '#9CA3AF';

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: 16 }}>
        <div className="spinner" />
        <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Loading analytics…</p>
      </div>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-3)' }}>
        <Activity size={40} style={{ margin: '0 auto 12px', color: 'var(--text-4)' }} />
        <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-2)', marginBottom: 6 }}>Link not found</p>
        <p style={{ fontSize: 14 }}>The analytics for this link couldn't be loaded.</p>
      </div>
    </AppLayout>
  );

  const { url, recentClicks, dailyClicks } = data;
  const shortUrl    = `${BASE_URL}/${url.short_code}`;
  const deviceData  = aggregate(recentClicks, 'device_type');
  const browserData = aggregate(recentClicks, 'browser');
  const osData      = aggregate(recentClicks, 'os');

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    return { date: format(d, 'MMM d'), count: dailyClicks.find(dc => dc.date === key)?.count || 0 };
  });

  const last30Total = dailyClicks.reduce((s, d) => s + d.count, 0);
  const daysActive  = Math.ceil((new Date() - new Date(url.created_at)) / 86400000);
  const avgPerDay   = daysActive > 0 ? (url.total_clicks / daysActive).toFixed(1) : '0';
  const hasData     = !chartData.every(d => d.count === 0);

  return (
    <AppLayout>

      {/* ── Back nav ── */}
      <Link to="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-3)', marginBottom: 22, textDecoration: 'none',
        fontWeight: 500,
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft size={15} /> Back to Links
      </Link>

      {/* ── Page title + actions ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{url.title || 'Link Analytics'}</h1>
          <p className="page-subtitle">Performance overview · Last updated just now</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowQR(s => !s)} className="btn-secondary" style={{ fontSize: 13 }}>
            <QrCode size={14} />
            {showQR ? 'Hide QR' : 'QR Code'}
          </button>
          <button onClick={handleCopy} className="btn-primary" style={{ fontSize: 13 }}>
            {copied
              ? <><Check size={14} />Copied!</>
              : <><Copy size={14} />Copy Link</>}
          </button>
        </div>
      </div>

      {/* ── Link info card ── */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--accent-subtle)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Link2 size={20} style={{ color: 'var(--accent)' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Short URL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 17, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                {shortUrl.replace(/^https?:\/\//, '')}
              </a>
              <ExternalLink size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
            </div>

            {/* Long URL */}
            <a href={url.original_url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 13, color: 'var(--text-3)', textDecoration: 'none',
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520,
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              {url.original_url}
            </a>

            {/* Meta pills */}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} />
                Created {format(new Date(url.created_at), 'MMM d, yyyy')}
              </span>
              {url.expires_at && (
                <span style={{ fontSize: 12, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} />
                  Expires {format(new Date(url.expires_at), 'MMM d, yyyy')}
                </span>
              )}
              {url.short_code && (
                <span style={{ fontSize: 12, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Link2 size={11} />
                  snip/{url.short_code}
                </span>
              )}
            </div>
          </div>

          {/* QR code */}
          {showQR && (
            <div style={{
              padding: 14, background: '#fff', borderRadius: 10,
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
            }}>
              <QRCodeSVG value={shortUrl} size={128} level="H" />
              <p style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', maxWidth: 128 }}>
                {shortUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 14, marginBottom: 22 }}>
        <StatCard
          icon={MousePointer} label="Total Clicks"
          value={(url.total_clicks || 0).toLocaleString()}
          sub="all time"
          color="#EE6123" bg="rgba(238,97,35,0.10)"
        />
        <StatCard
          icon={TrendingUp} label="Last 30 Days"
          value={last30Total.toLocaleString()}
          sub={`${avgPerDay} avg / day`}
          color="#3B82F6" bg="rgba(59,130,246,0.10)"
        />
        <StatCard
          icon={Activity} label="Days Active"
          value={daysActive}
          sub={`since ${format(new Date(url.created_at), 'MMM d')}`}
          color="#10B981" bg="rgba(16,185,129,0.10)"
        />
        <StatCard
          icon={Clock} label="Last Click"
          value={url.last_clicked_at
            ? formatDistanceToNow(new Date(url.last_clicked_at), { addSuffix: true })
            : 'Never'}
          sub={url.last_clicked_at ? format(new Date(url.last_clicked_at), 'MMM d, HH:mm') : 'No clicks yet'}
          color="#8B5CF6" bg="rgba(139,92,246,0.10)"
        />
      </div>

      {/* ── Area chart ── */}
      <div className="card" style={{ padding: '22px 24px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Click Activity</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Daily clicks over the last 30 days</p>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--accent-subtle)', padding: '4px 12px', borderRadius: 20,
          }}>
            {last30Total} clicks this month
          </div>
        </div>

        {!hasData ? (
          <div style={{
            height: 200, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-4)', fontSize: 14, gap: 8,
          }}>
            <Activity size={32} style={{ opacity: 0.4 }} />
            <p>No click data yet. Share your link to start tracking!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#EE6123" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#EE6123" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false} axisLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false} axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="count"
                stroke="#EE6123" strokeWidth={2.5}
                fill="url(#areaGrad)" name="Clicks"
                dot={false}
                activeDot={{ r: 5, fill: '#EE6123', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Breakdown row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16, marginBottom: 22 }}>
        <BreakdownCard title="Devices"  data={deviceData}  icon={Monitor}    />
        <BreakdownCard title="Browsers" data={browserData} icon={Globe}      />
        <BreakdownCard title="OS"       data={osData}      icon={Smartphone} />
      </div>

      {/* ── Recent visits table ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: url.ab_url ? 22 : 0 }}>
        {/* Table header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Recent Visits</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Showing last {recentClicks.length} visit{recentClicks.length !== 1 ? 's' : ''}
            </p>
          </div>
          {recentClicks.length > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--success)',
              background: 'var(--success-subtle)', padding: '4px 10px', borderRadius: 20,
            }}>
              Live
            </span>
          )}
        </div>

        {recentClicks.length === 0 ? (
          <div style={{
            padding: '60px 0', textAlign: 'center',
            color: 'var(--text-4)', fontSize: 14, display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <MousePointer size={32} style={{ opacity: 0.3 }} />
            <p>No visits recorded yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Copy and share your link to see real-time data here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>Country</th>
                  <th>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((click, idx) => (
                  <tr key={click.id || idx}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: 12 }}>
                      {format(new Date(click.clicked_at), 'MMM d, HH:mm')}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {click.device_type === 'mobile'
                          ? <Smartphone size={13} style={{ color: 'var(--accent)' }} />
                          : <Monitor size={13} style={{ color: 'var(--text-3)' }} />}
                        <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{click.device_type || '—'}</span>
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{click.browser || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{click.os || '—'}</td>
                    <td>
                      {click.country ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Globe size={11} style={{ color: 'var(--text-4)' }} />
                          {click.country}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: 160 }}>
                      {click.referer ? (() => {
                        try {
                          const host = new URL(click.referer).hostname;
                          return (
                            <a href={click.referer} target="_blank" rel="noopener noreferrer" style={{
                              color: 'var(--accent)', textDecoration: 'none', fontSize: 12,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              {host}
                              <ExternalLink size={10} />
                            </a>
                          );
                        } catch { return '—'; }
                      })() : (
                        <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Direct</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── A/B test results ── */}
      {url.ab_url && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>A/B Test Results</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Split test performance comparison</p>
          </div>

          {/* Combined bar */}
          {(() => {
            const a = url.ab_clicks_a || 0;
            const b = url.ab_clicks_b || 0;
            const total = a + b || 1;
            const pctA = Math.round((a / total) * 100);
            const pctB = 100 - pctA;
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                  <div style={{ width: `${pctA}%`, background: '#EE6123', borderRadius: '6px 0 0 6px', transition: 'width 0.6s' }} />
                  <div style={{ width: `${pctB}%`, background: '#3B82F6', borderRadius: '0 6px 6px 0', transition: 'width 0.6s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: '#EE6123', fontWeight: 600 }}>A: {pctA}%</span>
                  <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>B: {pctB}%</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'URL A — Primary', url: url.original_url, clicks: url.ab_clicks_a || 0, color: '#EE6123', bg: 'rgba(238,97,35,0.08)' },
              { label: 'URL B — Variant', url: url.ab_url,       clicks: url.ab_clicks_b || 0, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
            ].map(({ label, url: u, clicks, color, bg }) => (
              <div key={label} style={{
                padding: '16px 18px', borderRadius: 10,
                background: bg, border: `1px solid ${color}22`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {label}
                </p>
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-1px' }}>
                  {clicks.toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>clicks</p>
                <p style={{
                  fontSize: 11, color: 'var(--text-4)', marginTop: 10,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {u}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </AppLayout>
  );
}
