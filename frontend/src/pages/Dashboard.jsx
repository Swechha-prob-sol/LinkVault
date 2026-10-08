import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import FloatingStars from '../components/FloatingStars';
import apiClient from '../api/client';
import { getAnalyticsOverview } from '../api/analytics';

// Custom Tooltip for Dashboard Overview Chart
function DashboardAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-900/95 p-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(47,102,250,0.8)]" />
          <span className="text-sm font-semibold text-white">
            {payload[0].value.toLocaleString()} {payload[0].value === 1 ? 'click' : 'clicks'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [links, setLinks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    original_url: '',
    title: '',
    custom_slug: '',
  });

  const fetchData = async () => {
    try {
      const [linksRes, overviewData] = await Promise.all([
        apiClient.get('/api/links'),
        getAnalyticsOverview().catch((err) => {
          console.error('Failed to load overview:', err);
          return null;
        }),
      ]);

      setLinks(linksRes.data || []);
      setOverview(overviewData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.original_url) {
      showToast('Please enter a URL', 'error');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        original_url: formData.original_url,
        title: formData.title || formData.original_url,
      };
      if (formData.custom_slug) {
        payload.custom_slug = formData.custom_slug;
      }

      await apiClient.post('/api/links', payload);
      setFormData({ original_url: '', title: '', custom_slug: '' });
      showToast('Link created successfully!', 'success');
      fetchData();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create link';
      showToast(message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (identifier) => {
    const base = window.location.origin;
    const url = `${base}/${identifier}`;
    navigator.clipboard.writeText(url);
    showToast('Copied to clipboard!', 'success');
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      await apiClient.delete(`/api/links/${linkId}`);
      showToast('Link deleted', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to delete link', 'error');
    }
  };

  // Prepare chart data from overview.clicks_per_day
  const chartData = useMemo(() => {
    if (!overview?.clicks_per_day) return [];
    return overview.clicks_per_day.map((item) => {
      const parts = item.date.split('-');
      let dateLabel = item.date;
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return {
        date: dateLabel,
        clicks: item.count || 0,
      };
    });
  }, [overview?.clicks_per_day]);

  return (
    <div className="relative min-h-screen">
      <FloatingStars />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10 relative z-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text dark:text-white">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="mt-2 text-base md:text-lg dark:text-slate-400 text-slate-600">
              Create, manage, and analyze your short links in one unified dashboard.
            </p>
          </div>
          <Link
            to="/analytics"
            className="btn-secondary self-start md:self-auto flex items-center gap-2 text-sm"
          >
            <span>📊</span> Deep Analytics
          </Link>
        </div>

        {/* Account-Wide Analytics Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 border border-white/[0.06] space-y-3">
                <div className="h-4 w-20 rounded bg-surface-700/60" />
                <div className="h-8 w-16 rounded bg-surface-700/80" />
                <div className="h-3 w-28 rounded bg-surface-700/40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {/* Total Links Card */}
            <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-brand-500/40 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Links
                </p>
                <span className="text-xl">🔗</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {overview?.total_links ?? links.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {overview?.total_active_links ?? links.filter((l) => l.is_active).length} active now
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 opacity-60" />
            </div>

            {/* Total Clicks Card */}
            <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All-Time Clicks
                </p>
                <span className="text-xl">👆</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {(overview?.total_clicks ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Across all active links
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60" />
            </div>

            {/* 7-Day Clicks Card */}
            <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last 7 Days
                </p>
                <span className="text-xl">📈</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {(overview?.clicks_7d ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <span>⚡</span> Recent week volume
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
            </div>

            {/* 30-Day Clicks Card */}
            <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last 30 Days
                </p>
                <span className="text-xl">🎯</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {(overview?.clicks_30d ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-purple-400 flex items-center gap-1">
                <span>🗓️</span> Monthly engagement
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
            </div>
          </div>
        )}

        {/* Clicks Over Time Trend Chart */}
        {loading ? (
          <div className="glass-card p-6 border border-white/[0.06] animate-pulse h-64 flex flex-col justify-between">
            <div className="h-5 w-48 rounded bg-surface-700/80" />
            <div className="h-44 w-full rounded-xl bg-surface-800/40" />
          </div>
        ) : (
          <div className="glass-card p-6 border border-white/[0.06] animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📊</span> 30-Day Traffic Trend
                </h2>
                <p className="text-xs text-slate-400">
                  Account-wide click distribution over the past 30 days
                </p>
              </div>
              <Link
                to="/analytics"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 self-start sm:self-auto"
              >
                View Detailed Breakdown →
              </Link>
            </div>

            {overview?.total_clicks === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-surface-900/40 border border-white/[0.04]">
                <p className="text-sm font-semibold text-slate-300">No clicks recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Create links and share them to see your account traffic graph populate here.
                </p>
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2f66fa" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#2f66fa" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      minTickGap={25}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DashboardAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#dashboardGradient)"
                      dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }}
                      activeDot={{ r: 5, fill: '#60a5fa', stroke: '#1d4ed8', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Create Link Form */}
        <div className="glass-card p-6 md:p-8 border border-white/[0.06] animate-fade-in">
          <h2 className="mb-4 text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span>✨</span> Create New Link
          </h2>
          <form onSubmit={handleSubmit} className="form-container">
            <div>
              <label className="label-text">
                Destination URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/your-long-url"
                value={formData.original_url}
                onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">
                  Link Title (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Campaign 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., promo-launch"
                  value={formData.custom_slug}
                  onChange={(e) => setFormData({ ...formData, custom_slug: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn-primary mt-2 w-full text-base py-3"
            >
              {creating ? 'Creating Short Link...' : '🚀 Shorten Link'}
            </button>
          </form>
        </div>

        {/* Links List */}
        {!loading && links.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center border border-white/[0.06] animate-fade-in">
            <div className="text-5xl animate-float">🔗</div>
            <div>
              <h2 className="text-xl font-bold text-white">No links yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                Create your first link using the form above to get started!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📋</span> Your Links ({links.length})
              </h2>
            </div>

            <div className="space-y-3">
              {links.map((link) => {
                const identifier = link.custom_slug || link.short_code;
                return (
                  <div
                    key={link.id}
                    className="link-item flex flex-col md:flex-row md:items-center md:justify-between gap-4 group hover:border-brand-500/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-white truncate">
                          {link.title || 'Untitled Link'}
                        </h3>
                        {link.click_count > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                            👆 {link.click_count.toLocaleString()} clicks
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        🌐 {link.original_url}
                      </p>
                      <p className="mt-1.5 text-xs text-brand-400 font-mono font-medium">
                        /{identifier}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/analytics?linkId=${link.id}`)}
                        className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 hover:border-brand-500/40"
                        title="View analytics for this link"
                      >
                        <span>📊</span> Stats
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(identifier)}
                        className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                        title="Copy short link"
                      >
                        <span>📋</span> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(link.id)}
                        className="btn-secondary px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40"
                        title="Delete link"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
