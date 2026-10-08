import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import apiClient from '../api/client';
import { useToast } from '../hooks/useToast';
import FloatingStars from '../components/FloatingStars';
import ABTestCard from '../components/ABTestCard';

const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const DEVICE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#64748b'];
const BROWSER_COLORS = ['#6366f1', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#94a3b8'];

// Custom Dark Tooltip for Line/Area Chart
function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-900/95 p-3.5 shadow-2xl backdrop-blur-md">
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

// Custom Dark Tooltip for Bar / Pie Charts
function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-xl border border-white/10 bg-surface-900/95 px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
        <span className="font-semibold text-slate-200">{data.name}:</span>{' '}
        <span className="font-bold text-white ml-1">{data.value.toLocaleString()} clicks</span>
      </div>
    );
  }
  return null;
}

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [links, setLinks] = useState([]);
  const [selectedLinkId, setSelectedLinkId] = useState(searchParams.get('linkId') || '');
  const [range, setRange] = useState(30);

  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch all user links
  useEffect(() => {
    async function loadLinks() {
      setLoadingLinks(true);
      try {
        const response = await apiClient.get('/api/links');
        const activeLinks = response.data || [];
        setLinks(activeLinks);

        // If a linkId query param exists and matches an existing link, use it
        const paramId = searchParams.get('linkId');
        if (paramId && activeLinks.some((l) => String(l.id) === String(paramId))) {
          setSelectedLinkId(paramId);
        } else if (activeLinks.length > 0) {
          // Default to the first link
          setSelectedLinkId(String(activeLinks[0].id));
        }
      } catch (error) {
        console.error('Failed to load links:', error);
        showToast('Failed to load your links for analytics', 'error');
      } finally {
        setLoadingLinks(false);
      }
    }
    loadLinks();
  }, []);

  // Fetch stats whenever selected link or range changes
  useEffect(() => {
    if (!selectedLinkId) {
      setStats(null);
      return;
    }

    async function loadStats() {
      setLoadingStats(true);
      try {
        const response = await apiClient.get(`/api/stats/links/${selectedLinkId}?range=${range}`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
        showToast(error.response?.data?.error || 'Failed to load link analytics', 'error');
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, [selectedLinkId, range]);

  // Handle Link Selection Change
  const handleLinkChange = (e) => {
    const newId = e.target.value;
    setSelectedLinkId(newId);
    if (newId) {
      setSearchParams({ linkId: newId });
    } else {
      setSearchParams({});
    }
  };

  // Find currently selected link object
  const currentLink = useMemo(() => {
    return links.find((l) => String(l.id) === String(selectedLinkId)) || null;
  }, [links, selectedLinkId]);

  // Format peak hour nicely
  const formattedPeakHour = useMemo(() => {
    if (stats?.peak_hour === null || stats?.peak_hour === undefined) return 'N/A';
    const hour = stats.peak_hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formatted = hour % 12 === 0 ? 12 : hour % 12;
    return `${formatted}:00 ${ampm}`;
  }, [stats?.peak_hour]);

  // Prepare chart data
  const chartClicksOverTime = useMemo(() => {
    if (!stats?.clicks_over_time) return [];
    return stats.clicks_over_time.map((item) => {
      // Format 'YYYY-MM-DD' into readable 'MMM D'
      const parts = item.date.split('-');
      let dateLabel = item.date;
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return {
        date: dateLabel,
        rawDate: item.date,
        clicks: item.count || 0,
      };
    });
  }, [stats?.clicks_over_time]);

  const deviceChartData = useMemo(() => {
    if (!stats?.clicks_by_device) return [];
    return stats.clicks_by_device.map((d) => ({
      name: d.device || 'Unknown',
      value: d.count || 0,
    }));
  }, [stats?.clicks_by_device]);

  const browserChartData = useMemo(() => {
    if (!stats?.clicks_by_browser) return [];
    return stats.clicks_by_browser.map((b) => ({
      name: b.browser || 'Unknown',
      value: b.count || 0,
    }));
  }, [stats?.clicks_by_browser]);

  const countryChartData = useMemo(() => {
    if (!stats?.clicks_by_country) return [];
    // Recharts horizontal bar chart sorts top-to-bottom, slice top 6
    return stats.clicks_by_country.slice(0, 6).map((c) => ({
      country: c.country || 'Unknown',
      clicks: c.count || 0,
    }));
  }, [stats?.clicks_by_country]);

  // Copy short link helper
  const copyShortLink = () => {
    if (!currentLink) return;
    const base = window.location.origin;
    const identifier = currentLink.custom_slug || currentLink.short_code;
    const url = `${base}/${identifier}`;
    navigator.clipboard.writeText(url);
    showToast('Short link copied to clipboard!', 'success');
  };

  return (
    <div className="relative min-h-screen">
      <FloatingStars />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 relative z-10 space-y-8">
        {/* Header & Controls Bar */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Link Analytics
            </h1>
            <p className="mt-1 text-slate-400">
              Track engagement, geographic traffic, and audience insights in real time.
            </p>
          </div>

          {/* Controls: Link Selector & Range Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Link Selector */}
            {loadingLinks ? (
              <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-800/80 border border-white/[0.06]" />
            ) : links.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedLinkId}
                  onChange={handleLinkChange}
                  className="w-full sm:w-64 appearance-none rounded-xl border border-white/[0.08] bg-surface-800/90 px-4 py-2.5 pr-10 text-sm font-medium text-slate-200 shadow-inner focus:border-brand-500/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer truncate"
                >
                  {links.map((link) => (
                    <option key={link.id} value={link.id} className="bg-surface-900 text-white">
                      {link.title || link.original_url} ({link.custom_slug || link.short_code})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : null}

            {/* Range Toggle */}
            <div className="flex rounded-xl bg-surface-800/80 p-1 border border-white/[0.06] backdrop-blur-md">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    range === opt.value
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_2px_10px_rgba(47,102,250,0.5)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Link Info Header (if link selected) */}
        {currentLink && (
          <div className="glass-card p-5 border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                <h2 className="text-lg font-bold text-white truncate">
                  {currentLink.title || 'Untitled Link'}
                </h2>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="text-brand-400 font-mono">
                  /{currentLink.custom_slug || currentLink.short_code}
                </span>
                <span>•</span>
                <span className="truncate max-w-md text-slate-400 font-mono" title={currentLink.original_url}>
                  {currentLink.original_url}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShortLink}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                title="Copy short link to clipboard"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              <a
                href={`/${currentLink.custom_slug || currentLink.short_code}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                title="Open short link"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit
              </a>
            </div>
          </div>
        )}

        {/* Global Loading Skeletons */}
        {loadingLinks || loadingStats ? (
          <div className="space-y-6">
            {/* KPI Cards Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6 border border-white/[0.06] animate-pulse space-y-3">
                  <div className="h-4 w-24 rounded bg-surface-700/60" />
                  <div className="h-8 w-16 rounded bg-surface-700/80" />
                  <div className="h-3 w-32 rounded bg-surface-700/40" />
                </div>
              ))}
            </div>
            {/* Chart Skeleton */}
            <div className="glass-card p-6 border border-white/[0.06] animate-pulse h-80 flex flex-col justify-between">
              <div className="h-5 w-40 rounded bg-surface-700/80" />
              <div className="h-56 w-full rounded-xl bg-surface-800/40" />
            </div>
          </div>
        ) : links.length === 0 ? (
          /* Empty State: No links at all */
          <div className="glass-card p-12 text-center border border-white/[0.06] max-w-xl mx-auto my-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">No Links Created Yet</h3>
            <p className="text-sm text-slate-400">
              You need at least one short link to start collecting and viewing traffic analytics.
            </p>
            <div className="pt-2">
              <Link to="/dashboard" className="btn-primary">
                Create Your First Link
              </Link>
            </div>
          </div>
        ) : stats ? (
          /* Main Analytics Dashboard */
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-brand-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Clicks
                  </p>
                  <span className="rounded-lg bg-brand-500/10 p-2 text-brand-400">
                    📊
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">
                  {(stats.total_clicks || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Across past {range} days
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 opacity-60" />
              </div>

              <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Unique Countries
                  </p>
                  <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                    🌍
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">
                  {(stats.unique_countries || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Global locations reached
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
              </div>

              <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Peak Activity Hour
                  </p>
                  <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    ⚡
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">
                  {formattedPeakHour}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Highest engagement time (UTC)
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
              </div>

              <div className="glass-card p-5 border border-white/[0.06] relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Top Referrer
                  </p>
                  <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                    🔗
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-white truncate" title={stats.clicks_by_referrer?.[0]?.referrer || 'Direct'}>
                  {stats.clicks_by_referrer?.[0]
                    ? stats.clicks_by_referrer[0].referrer.replace(/^https?:\/\/(www\.)?/, '')
                    : 'Direct / None'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {stats.clicks_by_referrer?.[0]?.count
                    ? `${stats.clicks_by_referrer[0].count} clicks`
                    : 'No external referrer yet'}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
              </div>
            </div>

            {/* Line / Area Chart: Clicks Over Time */}
            <div className="glass-card p-6 border border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Clicks Over Time</h2>
                  <p className="text-xs text-slate-400">
                    Daily click volume for the past {range} days
                  </p>
                </div>
                <span className="text-xs font-medium text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 self-start sm:self-auto">
                  {stats.total_clicks} Total Clicks
                </span>
              </div>

              {stats.total_clicks === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-surface-900/40 border border-white/[0.04]">
                  <p className="text-sm font-semibold text-slate-300">No clicks recorded in the last {range} days</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Share your link on social media, newsletters, or websites to begin gathering engagement metrics.
                  </p>
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartClicksOverTime}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2f66fa" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#2f66fa" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        minTickGap={20}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomAreaTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#clickGradient)"
                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#60a5fa', stroke: '#1d4ed8', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Middle Grid: Countries Horizontal Bar & Devices/Browser Donut Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Countries Horizontal Bar Chart */}
              <div className="glass-card p-6 border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Top Locations</h2>
                  <p className="text-xs text-slate-400 mb-6">
                    Geographic distribution of your visitors
                  </p>
                </div>

                {countryChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-center text-slate-400 text-sm">
                    No country data available yet
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={countryChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="country"
                          stroke="#64748b"
                          tick={{ fill: '#cbd5e1', fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          width={90}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-white/10 bg-surface-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
                                  <p className="font-bold text-white">{d.country}</p>
                                  <p className="text-brand-400 font-semibold mt-0.5">{d.clicks} clicks</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="clicks"
                          fill="#3b82f6"
                          radius={[0, 6, 6, 0]}
                          barSize={18}
                        >
                          {countryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? '#3b82f6' : index === 1 ? '#6366f1' : '#8b5cf6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Devices & Browsers (Side-by-side or stacked donut charts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Device Donut Chart */}
                <div className="glass-card p-5 border border-white/[0.06] flex flex-col items-center justify-between">
                  <div className="w-full text-left">
                    <h3 className="text-sm font-bold text-white">Device Breakdown</h3>
                    <p className="text-xs text-slate-400">Desktop vs Mobile vs Tablet</p>
                  </div>

                  {deviceChartData.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                      No device data
                    </div>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {deviceChartData.map((entry, index) => (
                              <Cell key={`dev-cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Browser Donut Chart */}
                <div className="glass-card p-5 border border-white/[0.06] flex flex-col items-center justify-between">
                  <div className="w-full text-left">
                    <h3 className="text-sm font-bold text-white">Browser Breakdown</h3>
                    <p className="text-xs text-slate-400">Top user web browsers</p>
                  </div>

                  {browserChartData.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                      No browser data
                    </div>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={browserChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {browserChartData.map((entry, index) => (
                              <Cell key={`brw-cell-${index}`} fill={BROWSER_COLORS[index % BROWSER_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* A/B Testing Experiment Section */}
            {currentLink && <ABTestCard link={currentLink} />}

            {/* Bottom Row: Top Referrers Breakdown Table */}
            <div className="glass-card p-6 border border-white/[0.06]">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Top Referrers</h2>
                <p className="text-xs text-slate-400">
                  Websites and platforms directing traffic to this link
                </p>
              </div>

              {!stats.clicks_by_referrer || stats.clicks_by_referrer.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No referrers recorded yet (all direct clicks)
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-4">Referrer Source</th>
                        <th className="pb-3 px-4 text-right">Clicks</th>
                        <th className="pb-3 pl-4 text-right">Traffic Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {stats.clicks_by_referrer.map((ref, idx) => {
                        const totalClicks = stats.total_clicks || 1;
                        const percentage = Math.round(((ref.count || 0) / totalClicks) * 100);
                        return (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-4 font-medium text-slate-200 flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                              <span className="truncate max-w-xs md:max-w-md" title={ref.referrer}>
                                {ref.referrer === 'Direct' ? 'Direct / Bookmark / Email' : ref.referrer}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-white font-mono">
                              {(ref.count || 0).toLocaleString()}
                            </td>
                            <td className="py-3 pl-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="hidden sm:block h-2 w-24 rounded-full bg-surface-700 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                                    style={{ width: `${Math.max(percentage, 4)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-300 w-10 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Error or Empty Fallback */
          <div className="glass-card p-12 text-center border border-white/[0.06] max-w-lg mx-auto">
            <p className="text-slate-300 font-medium">Select a link above to inspect its analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
