import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Copy, Check, MousePointer, Clock,
  Calendar, Globe, Smartphone, Monitor, ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const BASE_URL   = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');
const PIE_COLORS = ['#EE6123','#F97316','#3B82F6','#10B981','#8B5CF6','#EC4899'];

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="stat-icon" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function aggregate(clicks, field) {
  const counts = {};
  clicks.forEach(c => { const k = c[field] || 'Unknown'; counts[k] = (counts[k] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);
}

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

  /* Theme-aware chart colors */
  const gridColor   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor   = isDark ? '#475569' : '#9CA3AF';
  const tooltipBg   = isDark ? '#1E293B' : '#FFFFFF';
  const tooltipBdr  = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
        Link not found
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

  return (
    <AppLayout>
      {/* Back */}
      <Link to="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-3)', marginBottom: 20, textDecoration: 'none',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft size={15} /> Back to Links
      </Link>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{url.title || 'Link Analytics'}</h1>
          <p className="page-subtitle">Performance data for your short link</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} className="btn-secondary">
            {copied ? <><Check size={14} style={{ color: 'var(--success)' }} />Copied!</> : <><Copy size={14} />Copy Link</>}
          </button>
          <button onClick={() => setShowQR(s => !s)} className="btn-secondary">
            {showQR ? 'Hide QR' : 'QR Code'}
          </button>
        </div>
      </div>

      {/* Link info card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>
            {shortUrl.replace(/^https?:\/\//, '')}
          </a>
          <ExternalLink size={13} style={{ color: 'var(--text-4)' }} />
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <a href={url.original_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', maxWidth: 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url.original_url}
          </a>
        </div>

        {showQR && (
          <div style={{ marginTop: 16, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, background: '#FFFFFF', borderRadius: 10 }}>
            <QRCodeSVG value={shortUrl} size={160} level="H" />
            <p style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{shortUrl}</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon={MousePointer} label="Total Clicks"
          value={(url.total_clicks || 0).toLocaleString()}
          color="var(--accent)"  bg="var(--accent-subtle)" />
        <StatCard icon={Clock} label="Last Visited"
          value={url.last_clicked_at
            ? formatDistanceToNow(new Date(url.last_clicked_at), { addSuffix: true }) : 'Never'}
          color="var(--success)" bg="var(--success-subtle)" />
        <StatCard icon={Calendar} label="Days Active"
          value={Math.ceil((new Date() - new Date(url.created_at)) / 86400000)}
          color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        <StatCard icon={Globe} label="Last 30 Days"
          value={dailyClicks.reduce((s, d) => s + d.count, 0)}
          color="#8B5CF6" bg="rgba(139,92,246,0.1)" />
      </div>

      {/* Area chart */}
      <div className="card" style={{ padding: '20px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          Daily Clicks — Last 30 Days
        </p>
        {chartData.every(d => d.count === 0) ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 14 }}>
            No click data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EE6123" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#EE6123" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false}
                interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-2)', fontWeight: 600 }}
                itemStyle={{ color: '#EE6123' }}
              />
              <Area type="monotone" dataKey="count" stroke="#EE6123" strokeWidth={2.5}
                fill="url(#grad)" name="Clicks" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { title: 'Devices',  chartData: deviceData },
          { title: 'Browsers', chartData: browserData },
          { title: 'OS',       chartData: osData },
        ].map(({ title, chartData: pieData }) => (
          <div key={title} className="card" style={{ padding: '18px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>{title}</p>
            {pieData.length === 0 ? (
              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: tickColor }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>

      {/* Recent visits table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
            Recent Visits
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)', marginLeft: 8 }}>
              (last {recentClicks.length})
            </span>
          </p>
        </div>
        {recentClicks.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
            No visits recorded yet
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
                {recentClicks.map(click => (
                  <tr key={click.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(click.clicked_at), 'MMM d, HH:mm')}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {click.device_type === 'mobile'
                          ? <Smartphone size={12} style={{ color: 'var(--accent)' }} />
                          : <Monitor size={12} style={{ color: 'var(--text-3)' }} />}
                        <span style={{ textTransform: 'capitalize' }}>{click.device_type || '—'}</span>
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{click.browser || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{click.os || '—'}</td>
                    <td>{click.country || '—'}</td>
                    <td style={{ maxWidth: 140 }}>
                      {click.referer ? (() => {
                        try {
                          return (
                            <a href={click.referer} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 12 }}>
                              {new URL(click.referer).hostname}
                            </a>
                          );
                        } catch { return '—'; }
                      })() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* A/B results if applicable */}
      {url.ab_url && (
        <div className="card" style={{ marginTop: 16, padding: '20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>A/B Test Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'URL A (Primary)', url: url.original_url, clicks: url.ab_clicks_a || 0, color: '#EE6123' },
              { label: 'URL B (Variant)', url: url.ab_url, clicks: url.ab_clicks_b || 0, color: '#3B82F6' },
            ].map(({ label, url: u, clicks, color }) => (
              <div key={label} style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>{clicks}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>clicks</p>
                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
