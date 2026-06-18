import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import { Search } from 'lucide-react';

interface SubmissionRow {
  student_id: string;
  student_name: string;
  student_email: string;
  homework_id: string;
  homework_title_en: string;
  homework_title_ar: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  last_submitted: string;
}

export function SubmissionsViewer() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: submissions } = await supabase
        .from('submissions')
        .select('student_id, homework_id, is_correct, submitted_at, profiles(email, full_name), homeworks(title_en, title_ar)');

      if (!submissions) { setLoading(false); return; }

      const map = new Map<string, SubmissionRow>();
      for (const s of submissions as any[]) {
        const key = `${s.student_id}-${s.homework_id}`;
        if (!map.has(key)) {
          map.set(key, {
            student_id: s.student_id,
            student_name: s.profiles?.full_name || '',
            student_email: s.profiles?.email || '',
            homework_id: s.homework_id,
            homework_title_en: s.homeworks?.title_en || '',
            homework_title_ar: s.homeworks?.title_ar || '',
            total_questions: 0,
            correct_count: 0,
            wrong_count: 0,
            last_submitted: s.submitted_at,
          });
        }
        const row = map.get(key)!;
        row.total_questions++;
        if (s.is_correct) row.correct_count++;
        else row.wrong_count++;
        if (s.submitted_at > row.last_submitted) row.last_submitted = s.submitted_at;
      }

      setRows(Array.from(map.values()).sort((a, b) => b.last_submitted.localeCompare(a.last_submitted)));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = rows.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase()) ||
      (lang === 'ar' ? r.homework_title_ar : r.homework_title_en).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('admin.submissions.title')}</h2>

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
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin.submissions.student')}</th>
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin.submissions.homework')}</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin.submissions.correctCount')}</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin.submissions.wrongCount')}</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={`${r.student_id}-${r.homework_id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{r.student_name || '—'}</p>
                      <p className="text-xs text-slate-500">{r.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {lang === 'ar' ? (r.homework_title_ar || r.homework_title_en) : (r.homework_title_en || r.homework_title_ar)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                        {r.correct_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                        {r.wrong_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-800">
                        {r.total_questions > 0 ? Math.round((r.correct_count / r.total_questions) * 100) : 0}%
                      </span>
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
