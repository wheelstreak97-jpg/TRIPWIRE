import { FormEvent, useState } from 'react';
import { Zap, Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await completeOnboarding(orgName.trim(), fullName.trim());
    setSaving(false);
    if (result.error) setError(result.error);
  };

  const inputCls =
    'w-full rounded-btn border border-edge bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-safe focus:outline-none transition-colors';
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1.5';

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-8">
        <Zap size={24} className="text-safe" />
        <span className="font-display font-bold text-2xl tracking-tight">Tripwire</span>
      </div>
      <div className="w-full max-w-sm rounded-card border border-edge bg-surface/50 p-8">
        <h1 className="text-xl font-semibold mb-1">Set up your workspace</h1>
        <p className="text-sm text-text-secondary mb-6">
          One last step — name your team so we can start tracking renewals.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Your name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Rivera"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Company or team name</label>
            <input
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
              className={inputCls}
            />
          </div>
          {error && (
            <p className="text-sm text-urgent bg-urgent/10 border border-urgent/30 rounded-btn px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-btn bg-safe px-4 py-2.5 text-sm font-semibold text-bg hover:bg-safe/90 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Create workspace
          </button>
        </form>
      </div>
    </div>
  );
}
