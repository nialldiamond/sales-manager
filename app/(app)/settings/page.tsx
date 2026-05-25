'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EvoxAccountManager } from '@/types';

interface AccountManagerResponse {
  data: EvoxAccountManager[];
}

interface ProfileResponse {
  profile: { evox_account_manager_id: number; name: string | null } | null;
}

export default function SettingsPage() {
  const [managers, setManagers] = useState<EvoxAccountManager[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const [mgrsRes, profileRes] = await Promise.all([
        fetch('/api/account-managers'),
        fetch('/api/profile'),
      ]);
      const mgrsData: AccountManagerResponse = await mgrsRes.json();
      const profileData: ProfileResponse = await profileRes.json();

      if (mgrsData.data) setManagers(mgrsData.data);
      if (profileData.profile?.evox_account_manager_id) {
        setSelectedId(String(profileData.profile.evox_account_manager_id));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    const manager = managers.find(m => m.id === Number(selectedId));
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evox_account_manager_id: Number(selectedId),
        name: manager?.name ?? null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Failed to save');
    } else {
      setSaved(true);
      setTimeout(() => router.push('/dashboard'), 800);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Link your EvoX account manager identity so the hub knows which customers to show you.
      </p>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Your EvoX Account Manager</h2>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading account managers…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                Select your name
              </label>
              {managers.length === 0 ? (
                <p className="text-sm text-red-600">
                  No account managers found in the EvoX store. Ensure the API token is correct.
                </p>
              ) : (
                <select
                  id="manager"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Choose account manager —</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.email ? `(${m.email})` : ''} — ID {m.id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {saved && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <p className="text-sm text-green-700">Saved! Redirecting to dashboard…</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !selectedId}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save & go to dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
