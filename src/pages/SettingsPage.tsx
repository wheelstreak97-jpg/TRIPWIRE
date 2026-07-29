import { FormEvent, useState } from 'react';
import { Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function SettingsPage() {
  const { organization, profile, user } = useAuth();
  const { showToast } = useToast();
  const [orgName, setOrgName] = useState(organization?.name ?? '');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!organization || !profile) return;
    setSaving(true);
    const [orgRes, profRes] = await Promise.all([
      supabase.from('organizations').update({ name: orgName.trim() }).eq('id', organization.id),
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id),
    ]);
    setSaving(false);
    if (orgRes.error || profRes.error) {
      showToast('Could not save your changes. Try again.', 'error');
      return;
    }
    showToast('Settings saved');
  };

  const inputCls =
    'w-full rounded-btn border border-edge bg-bg px-3 py-2 text-sm text-text-primary focus:border-safe focus:outline-none transition-colors';
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1.5';

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Your workspace and profile.</p>
      </div>
      <form
        onSubmit={handleSave}
        className="rounded-card border border-edge bg-surface p-6 flex flex-col gap-4"
      >
        <div>
          <label className={labelCls}>Organization name</label>
          <input
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Your name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input value={user?.email ?? ''} disabled className={`${inputCls} opacity-60`} />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
