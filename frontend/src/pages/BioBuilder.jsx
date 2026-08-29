import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function BioBuilder() {
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [theme, setTheme] = useState(user?.page_theme || 'dark');
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: 'link' });
  const [saved, setSaved] = useState(false);

  const themes = [
    { id: 'dark', name: 'Dark' },
    { id: 'light', name: 'Light' },
    { id: 'purple', name: 'Purple Gradient' },
    { id: 'ocean', name: 'Ocean' },
    { id: 'sunset', name: 'Sunset' },
    { id: 'minimal', name: 'Minimal' }
  ];

  const handleSaveBio = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setLinks([...links, { ...newLink, id: Date.now() }]);
      setNewLink({ title: '', url: '', icon: 'link' });
    }
  };

  const handleDeleteLink = (id) => {
    setLinks(links.filter(l => l.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Editor Panel */}
      <div className="flex-1 border-r border-white/[0.06] p-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-white mb-8">Bio Builder</h1>

          {/* Avatar */}
          <div className="mb-8">
            <label className="label-text">Avatar URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="input-field"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="label-text">Bio ({bio.length}/150)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              className="w-full rounded-xl bg-surface-900/80 border border-white/[0.08] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/60 h-24"
              placeholder="Tell people about yourself..."
            />
          </div>

          {/* Theme */}
          <div className="mb-8">
            <label className="label-text">Page Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="input-field"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button onClick={handleSaveBio} className="btn-primary w-full">
            {saved ? '✓ Saved' : 'Save Bio'}
          </button>

          {/* Links Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">Bio Links</h2>

            {/* Add Link Form */}
            <div className="glass-card p-4 mb-4">
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                className="input-field mb-3"
                placeholder="Link title"
              />
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                className="input-field mb-3"
                placeholder="URL"
              />
              <button onClick={handleAddLink} className="btn-primary w-full">
                Add Link
              </button>
            </div>

            {/* Links List */}
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{link.title}</p>
                    <p className="text-xs text-slate-400">{link.url}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-80 bg-surface-900/40 p-8 sticky top-0 h-screen flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Preview</h3>

        {/* Phone Preview */}
        <div className="flex-1 bg-black rounded-3xl border-8 border-slate-800 overflow-hidden flex flex-col">
          <div className="flex-1 bg-gradient-to-b from-surface-800 to-surface-900 p-4 flex flex-col items-center justify-start pt-12">
            {avatar && (
              <img
                src={avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full mb-4 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <h4 className="text-sm font-semibold text-white text-center mb-2">{user?.username}</h4>
            {bio && (
              <p className="text-xs text-slate-400 text-center mb-6">{bio}</p>
            )}

            <div className="space-y-2 w-full px-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  className="block glass-card p-3 text-center text-sm font-medium text-white hover:bg-surface-700/50 transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-auto pt-4 text-center">
              Create your own at LinkVault
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
