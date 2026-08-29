import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import FloatingStars from '../components/FloatingStars';
import apiClient from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ total_links: 0, total_clicks: 0, active_links: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    original_url: '',
    title: '',
    custom_slug: '',
  });

  const fetchLinks = async () => {
    try {
      const response = await apiClient.get('/api/links');
      setLinks(response.data);

      const totalClicks = response.data.reduce((sum, link) => sum + (link.click_count || 0), 0);
      const activeLinks = response.data.filter(link => link.is_active).length;
      setStats({
        total_links: response.data.length,
        total_clicks: totalClicks,
        active_links: activeLinks,
      });
    } catch (error) {
      console.error('Failed to fetch links:', error);
      showToast('Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
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

      const response = await apiClient.post('/api/links', payload);
      setFormData({ original_url: '', title: '', custom_slug: '' });
      showToast('Link created successfully!', 'success');
      fetchLinks();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create link';
      showToast(message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      await apiClient.delete(`/api/links/${linkId}`);
      showToast('Link deleted', 'success');
      fetchLinks();
    } catch (error) {
      showToast('Failed to delete link', 'error');
    }
  };

  return (
    <div className="relative min-h-screen">
      <FloatingStars />
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10 relative z-10">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text dark:text-white">
            Welcome back, {user?.username}! 👋
          </h1>
          <p className="mt-3 text-lg dark:text-slate-400 text-slate-600">
            Create and manage your short links with powerful analytics.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3 animate-fade-in">
          <div className="stat-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-slate-400 text-slate-600">Total links</p>
                <p className="mt-3 text-4xl font-bold gradient-text dark:text-white">{stats.total_links}</p>
              </div>
              <div className="text-5xl opacity-20">🔗</div>
            </div>
          </div>
          <div className="stat-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-slate-400 text-slate-600">Total clicks</p>
                <p className="mt-3 text-4xl font-bold gradient-text dark:text-white">{stats.total_clicks}</p>
              </div>
              <div className="text-5xl opacity-20">👆</div>
            </div>
          </div>
          <div className="stat-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-slate-400 text-slate-600">Active links</p>
                <p className="mt-3 text-4xl font-bold gradient-text dark:text-white">{stats.active_links}</p>
              </div>
              <div className="text-5xl opacity-20">✨</div>
            </div>
          </div>
        </div>

        {/* Create Link Form */}
        <div className="mb-8 glass-card p-8 md:p-10 animate-fade-in">
        <h2 className="mb-6 text-2xl font-bold gradient-text dark:text-white">✨ Create New Link</h2>
        <form onSubmit={handleSubmit} className="form-container">
          <div>
            <label className="label-text">
              🔗 Original URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={formData.original_url}
              onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">
                📝 Title
              </label>
              <input
                type="text"
                placeholder="Give your link a name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">
                🎯 Custom Slug
              </label>
              <input
                type="text"
                placeholder="custom (optional)"
                value={formData.custom_slug}
                onChange={(e) => setFormData({ ...formData, custom_slug: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-primary mt-6 w-full text-lg py-3"
          >
            {creating ? '⏳ Creating...' : '🚀 Create Link'}
          </button>
        </form>
      </div>

        {/* Links List */}
        {!loading && links.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center animate-fade-in">
            <div className="text-6xl animate-float">🔗</div>
            <div>
              <h2 className="text-2xl font-bold gradient-text dark:text-white">No links yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-base dark:text-slate-400 text-slate-600">
                Create your first link using the form above to get started! 🚀
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold gradient-text dark:text-white mb-6">📊 Your Links</h2>
            {links.map((link, index) => (
              <div
                key={link.id}
                className="link-item flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg dark:text-white text-slate-900 truncate">
                    {link.title || 'Untitled Link'}
                  </h3>
                  <p className="text-sm dark:text-slate-400 text-slate-600 truncate mt-1">
                    🌐 {link.original_url}
                  </p>
                  <p className="mt-2 text-xs dark:text-slate-500 text-slate-500">
                    <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-mono font-bold">
                      localhost:5000/{link.short_code}
                    </span>
                    {link.click_count > 0 && (
                      <span className="ml-3 inline-block px-2 py-1 rounded-full text-xs font-semibold dark:bg-green-500/20 dark:text-green-300 bg-green-100 text-green-700">
                        👆 {link.click_count} clicks
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(`http://localhost:5000/${link.short_code}`)}
                    className="btn-secondary px-4 py-2 text-sm hover:scale-105"
                    title="Copy short link"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="btn-secondary px-4 py-2 text-sm dark:text-red-400 dark:hover:text-red-300 text-red-600 hover:text-red-700 hover:scale-105"
                    title="Delete link"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
