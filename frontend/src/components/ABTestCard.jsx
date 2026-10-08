import { useState, useEffect } from 'react';
import { getABTest, saveABTest, deleteABTest } from '../api/analytics';
import { useToast } from '../hooks/useToast';

export default function ABTestCard({ link }) {
  const { showToast } = useToast();
  const [abTest, setAbTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    url_b: '',
    split_percentage: 50,
  });

  const loadABTest = async () => {
    if (!link?.id) return;
    setLoading(true);
    try {
      const data = await getABTest(link.id);
      setAbTest(data);
      setFormData({
        url_b: data.url_b || '',
        split_percentage: data.split_percentage || 50,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setAbTest(null);
        setFormData({
          url_b: '',
          split_percentage: 50,
        });
      } else {
        console.error('Error fetching A/B test:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadABTest();
  }, [link?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.url_b) {
      showToast('Please enter a destination URL for Variant B', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveABTest(link.id, {
        url_b: formData.url_b,
        split_percentage: parseInt(formData.split_percentage, 10),
      });
      showToast('A/B test configured successfully!', 'success');
      setModalOpen(false);
      loadABTest();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save A/B test';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this A/B test? Traffic will only go to Variant A.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteABTest(link.id);
      showToast('A/B test deleted', 'success');
      setAbTest(null);
      setFormData({ url_b: '', split_percentage: 50 });
    } catch (err) {
      showToast('Failed to delete A/B test', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!link) return null;

  if (loading) {
    return (
      <div className="glass-card p-6 border border-white/[0.06] animate-pulse space-y-4">
        <div className="h-5 w-44 rounded bg-surface-700/80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 rounded-xl bg-surface-800/60" />
          <div className="h-36 rounded-xl bg-surface-800/60" />
        </div>
      </div>
    );
  }

  // Calculations when A/B test exists
  const clicksA = abTest?.clicks_a || 0;
  const clicksB = abTest?.clicks_b || 0;
  const totalABClicks = clicksA + clicksB;
  const percentA = totalABClicks > 0 ? Math.round((clicksA / totalABClicks) * 100) : 0;
  const percentB = totalABClicks > 0 ? 100 - percentA : 0;

  const isLeadingA = totalABClicks > 0 && clicksA > clicksB;
  const isLeadingB = totalABClicks > 0 && clicksB > clicksA;
  const isSampleSmall = totalABClicks < 100;

  return (
    <div className="glass-card p-6 border border-white/[0.06] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🧪</span> A/B Split Test Experiment
            </h2>
            {abTest && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {abTest.split_percentage}% / {100 - abTest.split_percentage}% Split
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Split traffic randomly between two destination URLs to measure performance.
          </p>
        </div>

        <div>
          {abTest ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <span>✏️</span> Edit Split
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="btn-secondary text-xs px-3 py-1.5 text-red-400 hover:text-red-300 hover:border-red-500/40 flex items-center gap-1.5"
              >
                <span>🗑️</span> {deleting ? 'Deleting...' : 'Delete Test'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <span>✨</span> Set Up A/B Test
            </button>
          )}
        </div>
      </div>

      {!abTest ? (
        /* Empty State: No A/B Test Configured */
        <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-white/[0.04] space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 text-2xl">
            ⚖️
          </div>
          <h3 className="text-base font-bold text-white">No A/B Test Configured</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Direct a percentage of visitors to an alternate landing page or URL (Variant B) to test which conversion funnel performs better.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Configure Split Test
            </button>
          </div>
        </div>
      ) : (
        /* Active A/B Test Display */
        <div className="space-y-6">
          {/* Small Sample Size Warning Banner */}
          {isSampleSmall && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-200">
              <span className="text-lg">⚠️</span>
              <div className="text-xs">
                <p className="font-semibold text-amber-300">
                  Low sample size ({totalABClicks} total clicks)
                </p>
                <p className="text-amber-200/80 mt-0.5">
                  At least 100 clicks are recommended before declaring a statistically reliable winner. Continue running the test.
                </p>
              </div>
            </div>
          )}

          {/* Dual Variant Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Variant A Card */}
            <div
              className={`rounded-xl p-5 border transition-all ${
                isLeadingA
                  ? 'bg-surface-800/80 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-surface-800/50 border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <h4 className="font-bold text-sm text-white">Variant A (Original)</h4>
                  <span className="text-xs text-slate-400 font-mono">
                    ({abTest.split_percentage}% traffic)
                  </span>
                </div>
                {isLeadingA && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                    👑 Leading
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 truncate mb-4 font-mono" title={abTest.url_a}>
                {abTest.url_a}
              </p>

              <div className="flex items-end justify-between pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-xs text-slate-400">Total Clicks</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">
                    {clicksA.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Traffic Share</p>
                  <p className="text-2xl font-extrabold text-blue-400 mt-0.5">
                    {percentA}%
                  </p>
                </div>
              </div>
            </div>

            {/* Variant B Card */}
            <div
              className={`rounded-xl p-5 border transition-all ${
                isLeadingB
                  ? 'bg-surface-800/80 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-surface-800/50 border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <h4 className="font-bold text-sm text-white">Variant B (Challenger)</h4>
                  <span className="text-xs text-slate-400 font-mono">
                    ({100 - abTest.split_percentage}% traffic)
                  </span>
                </div>
                {isLeadingB && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                    👑 Leading
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 truncate mb-4 font-mono" title={abTest.url_b}>
                {abTest.url_b}
              </p>

              <div className="flex items-end justify-between pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-xs text-slate-400">Total Clicks</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">
                    {clicksB.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Traffic Share</p>
                  <p className="text-2xl font-extrabold text-purple-400 mt-0.5">
                    {percentB}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="text-blue-400 font-semibold">Variant A: {clicksA} clicks ({percentA}%)</span>
              <span className="text-slate-500">Target Split: {abTest.split_percentage}% / {100 - abTest.split_percentage}%</span>
              <span className="text-purple-400 font-semibold">Variant B: {clicksB} clicks ({percentB}%)</span>
            </div>

            <div className="relative h-3 w-full rounded-full bg-surface-950 overflow-hidden flex border border-white/[0.08]">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${totalABClicks > 0 ? percentA : abTest.split_percentage}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${totalABClicks > 0 ? percentB : 100 - abTest.split_percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit A/B Test Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 md:p-8 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🧪</span> {abTest ? 'Edit A/B Split Test' : 'Configure New A/B Test'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="label-text text-xs">
                  Variant A (Original Destination)
                </label>
                <input
                  type="text"
                  disabled
                  value={link.original_url}
                  className="input-field opacity-60 cursor-not-allowed text-xs font-mono"
                />
              </div>

              <div>
                <label className="label-text text-xs">
                  Variant B (Challenger URL) <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://alternative-landing-page.com"
                  value={formData.url_b}
                  onChange={(e) => setFormData({ ...formData, url_b: e.target.value })}
                  className="input-field text-xs font-mono"
                />
              </div>

              {/* Traffic Split Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-blue-400">
                    Variant A: {formData.split_percentage}%
                  </span>
                  <span className="text-purple-400">
                    Variant B: {100 - formData.split_percentage}%
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="99"
                  value={formData.split_percentage}
                  onChange={(e) => setFormData({ ...formData, split_percentage: Number(e.target.value) })}
                  className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />

                <p className="text-[11px] text-slate-400 text-center">
                  Drag the slider to adjust traffic distribution between Variant A and Variant B.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saving ? 'Saving...' : abTest ? 'Update Split Test' : 'Start Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
