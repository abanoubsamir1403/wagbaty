import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import type { Profile } from '../../lib/types';
import { UserPlus, Trash2, Search } from 'lucide-react';

export function StudentsManager() {
  const { t } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAddError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAddError('Not authenticated');
      setSaving(false);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email: newEmail, password: newPassword, fullName: newName }),
    });

    const result = await res.json();

    if (!res.ok) {
      setAddError(result.error || 'Failed to create student');
      setSaving(false);
      return;
    }

    setNewEmail('');
    setNewName('');
    setNewPassword('');
    setShowAdd(false);
    fetchStudents();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-student`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: id }),
    });
    fetchStudents();
  };

  const filtered = students.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('admin.students.title')}</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all shadow-md shadow-teal-200 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          {t('admin.students.add')}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 space-y-4 animate-[fadeIn_0.2s_ease]">
          {addError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{addError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.create')}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">{t('common.noData')}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.name')}</th>
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.email')}</th>
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.full_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.email}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
