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
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const BASE_URL      = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');
const PIE_COLORS    = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="stat-icon" style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-xl font-bold t1">{value}</p>
          <p className="text-xs t3">{label}</p>
        </div>
      </div>
    </div>
  );
}

function aggregate(clicks, field) {
  const counts = {};
  clicks.forEach(c => { const k = c[field] || 'unknown'; counts[k] = (counts[k] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function Analytics() {
  const { id }      = useParams();
  const { isDark }  = useTheme();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    api.get(`/urls/${id}/stats`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(`${BASE_URL}/${data.url.short_code}`);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  if (loading) return (
    <div className="min-h-screen"><Navbar />
      <div className="flex items-center justify-center py-32"><div className="spinner" /></div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen"><Navbar />
      <div className="text-center py-32 t3">URL not found</div>
    </div>
  );

  const { url, recentClicks, dailyClicks } = data;
  const shortUrl    = `${BASE_URL}/${url.short_code}`;
  const deviceData  = aggregate(recentClicks, 'device_type');
  const browserData = aggregate(recentClicks, 'browser');
  const osData      = aggregate(recentClicks, 'os');

  // Chart colours that adapt to theme
  const gridColor   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor   = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg   = isDark ? '#1e293b' : '#ffffff';
  const tooltipBdr  = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const tooltipText = isDark ? '#cbd5e1' : '#334155';

  // Fill 30-day range with zeros
  const chartData = (() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(today); d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      return { date: format(d, 'MMM d'), count: dailyClicks.find(dc => dc.date === key)?.count || 0 };
    });
  })();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        <Link to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm t3 mb-6 transition-colors"
          style={{ textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-3)'}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* URL info card */}
        <div className="card p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {url.title && <h1 className="text-lg font-semibold t1 mb-1">{url.title}</h1>}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium" style={{ color: 'var(--accent)' }}>{shortUrl}</span>
                <button onClick={handleCopy} className="icon-btn accent" style={{ padding: 4 }}>
                  {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                </button>
              </div>
              <a href={url.original_url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 mt-1 group" style={{ color: 'var(--text-3)', fontSize: 13 }}>
                <span className="truncate max-w-sm">{url.original_url}</span>
                <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-center gap-3 mt-2 text-xs t3">
                <span>Created {format(new Date(url.created_at), 'MMM d, yyyy')}</span>
                {url.expires_at && (
                  <span style={{ color: 'var(--warning)' }}>
                    Expires {format(new Date(url.expires_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setShowQR(s => !s)} className="btn-secondary text-sm px-4 py-2 shrink-0">
              {showQR ? 'Hide QR' : 'Show QR Code'}
            </button>
          </div>

          {showQR && (
            <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-white rounded-xl w-fit">
              <QRCodeSVG value={shortUrl} size={160} level="H" />
              <p className="text-xs text-slate-600 font-medium">{shortUrl}</p>
            </div>
          )}
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={MousePointer} label="Total Clicks"
            value={(url.total_clicks || 0).toLocaleString()}
            iconBg="rgba(99,102,241,0.12)" iconColor="#6366f1" />
          <StatCard icon={Clock} label="Last Visited"
            value={url.last_clicked_at
              ? formatDistanceToNow(new Date(url.last_clicked_at), { addSuffix: true })
              : 'Never'}
            iconBg="rgba(168,85,247,0.12)" iconColor="#a855f7" />
          <StatCard icon={Calendar} label="Days Active"
            value={Math.ceil((new Date() - new Date(url.created_at)) / 86400000)}
            iconBg="rgba(16,185,129,0.12)" iconColor="#10b981" />
          <StatCard icon={Globe} label="Clicks (30d)"
            value={dailyClicks.reduce((s, d) => s + d.count, 0)}
            iconBg="rgba(6,182,212,0.12)" iconColor="#06b6d4" />
        </div>

        {/* Daily clicks chart */}
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold t1 mb-4">Daily Clicks – Last 30 Days</h2>
          {chartData.every(d => d.count === 0) ? (
            <div className="flex items-center justify-center h-40 t3 text-sm">No click data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false}
                       interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8 }}
                         labelStyle={{ color: tooltipText, fontSize: 12 }}
                         itemStyle={{ color: '#818cf8' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2}
                      fill="url(#cg)" name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown pie charts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { title: 'Devices',  data: deviceData },
            { title: 'Browsers', data: browserData },
            { title: 'OS',       data: osData },
          ].map(({ title, data: pieData }) => (
            <div key={title} className="card p-5">
              <h2 className="text-sm font-semibold t1 mb-3">{title}</h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-24 t3 text-xs">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
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

        {/* Recent visits */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold t1 mb-4">Recent Visit History</h2>
          {recentClicks.length === 0 ? (
            <div className="text-center py-8 t3 text-sm">No visits recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs t3" style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Time','Device','Browser','OS','Referer'].map(h => (
                      <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClicks.map((click, i) => (
                    <tr key={click.id} className="t3 transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-xs">
                        {format(new Date(click.clicked_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-1">
                          {click.device_type === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                          <span className="capitalize">{click.device_type || '—'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 capitalize">{click.browser || '—'}</td>
                      <td className="py-2.5 pr-4 capitalize">{click.os || '—'}</td>
                      <td className="py-2.5 text-xs truncate max-w-[8rem]">
                        {click.referer ? (() => {
                          try {
                            return <a href={click.referer} target="_blank" rel="noopener noreferrer"
                                      style={{ color: 'var(--accent)' }}>
                              {new URL(click.referer).hostname}
                            </a>;
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
      </main>
    </div>
  );
}
