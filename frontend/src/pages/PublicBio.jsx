import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PublicBio() {
  const { username } = useParams();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bio/public/${username}`);
        if (res.ok) {
          const data = await res.json();
          setBio(data);
        }
      } catch (err) {
        console.error('Error loading bio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBio();
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!bio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Bio not found</h1>
          <p className="text-slate-400">Check the username and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bio.page_theme === 'light' ? 'bg-white' : 'bg-surface-950'}`}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Avatar */}
        {bio.avatar_url && (
          <img
            src={bio.avatar_url}
            alt={bio.username}
            className="w-24 h-24 rounded-full mb-6 object-cover ring-2 ring-brand-500/30"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}

        {/* Username */}
        <h1 className={`text-3xl font-bold ${bio.page_theme === 'light' ? 'text-black' : 'text-white'} mb-2`}>
          @{bio.username}
        </h1>

        {/* Bio */}
        {bio.bio && (
          <p className={`text-center max-w-md mb-8 ${bio.page_theme === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
            {bio.bio}
          </p>
        )}

        {/* Links */}
        {bio.links && bio.links.length > 0 && (
          <div className="w-full max-w-sm space-y-3 mb-12">
            {bio.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-xl font-medium transition-all text-center ${
                  bio.page_theme === 'light'
                    ? 'bg-gray-100 text-black hover:bg-gray-200'
                    : 'glass-card text-white hover:bg-surface-700/50'
                }`}
              >
                {link.title}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className={`text-sm ${bio.page_theme === 'light' ? 'text-gray-500' : 'text-slate-500'}`}>
          Create your own at <span className="font-semibold">LinkVault</span>
        </p>
      </div>
    </div>
  );
}
