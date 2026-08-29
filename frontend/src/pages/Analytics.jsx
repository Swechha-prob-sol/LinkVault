export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Your link performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: '0', icon: '📊' },
          { label: 'This Week', value: '0', icon: '📈' },
          { label: 'This Month', value: '0', icon: '📉' },
          { label: 'All Time', value: '0', icon: '🎯' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6">
            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-2xl mt-2">{stat.icon}</p>
          </div>
        ))}
      </div>

      {/* Placeholder Chart */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">30-Day Trend</h2>
        <div className="h-64 bg-surface-800/50 rounded-lg flex items-center justify-center text-slate-400">
          Chart coming soon
        </div>
      </div>

      {/* Recent Clicks */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="text-slate-400 text-center py-8">
          No clicks yet
        </div>
      </div>
    </div>
  );
}
