import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete form
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ avatar_url: avatar, bio })
      });

      if (res.ok) {
        setMessage('Profile updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });

      if (res.ok) {
        setMessage('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      setError('Email does not match');
      return;
    }

    if (deleteConfirm !== 'DELETE') {
      setError('Type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password: deletePassword, email: deleteEmail })
      });

      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('Error deleting account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'password', label: 'Password' },
          { id: 'danger', label: 'Danger Zone' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="label-text">Username</label>
                <input
                  type="text"
                  disabled
                  value={user?.username || ''}
                  className="input-field opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="label-text">Avatar URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="label-text">Bio ({bio.length}/150)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  className="w-full rounded-xl bg-surface-900/80 border border-white/[0.08] px-4 py-2.5 text-sm text-slate-100 h-24"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>

            <div className="space-y-6">
              <div>
                <label className="label-text">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {tab === 'danger' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-card p-6 border-red-500/30">
            <h2 className="text-xl font-semibold text-red-400 mb-6">Delete Account</h2>

            <p className="text-slate-400 mb-6">
              This action cannot be undone. All your links, clicks, and data will be permanently deleted.
            </p>

            <div className="space-y-6">
              <div>
                <label className="label-text">Email Confirmation</label>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder={user?.email}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Type "DELETE" to confirm</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  className="input-field"
                  placeholder="DELETE"
                />
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
