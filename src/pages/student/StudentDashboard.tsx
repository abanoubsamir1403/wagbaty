import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import type { Homework, Submission } from '../../lib/types';
import { BookOpen, Globe, LogOut, Play, Trophy } from 'lucide-react';

interface AssignedHomework {
  homework: Homework;
  assignment_id: string;
  submissions: Submission[];
}

export function StudentDashboard({
  onStartHomework,
  onViewResults,
  onLogout,
}: {
  onStartHomework: (id: string) => void;
  onViewResults: (id: string) => void;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [assigned, setAssigned] = useState<AssignedHomework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      const { data: assignments } = await supabase
        .from('homework_assignments')
        .select('id, homework_id, homeworks(*)')
        .eq('student_id', user.id);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id);

      const result: AssignedHomework[] = (assignments || []).map((a: any) => ({
        homework: a.homeworks,
        assignment_id: a.id,
        submissions: (submissions || []).filter((s) => s.homework_id === a.homework_id),
      }));

      setAssigned(result);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const isCompleted = async (homeworkId: string) => {
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('homework_id', homeworkId);

    const { count: answeredQuestions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('homework_id', homeworkId)
      .eq('student_id', user?.id);

    return (answeredQuestions || 0) >= (totalQuestions || 0) && (totalQuestions || 0) > 0;
  };

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const check = async () => {
      const results = await Promise.all(assigned.map((a) => isCompleted(a.homework.id)));
      setCompletedIds(new Set(assigned.filter((_, i) => results[i]).map((a) => a.homework.id)));
    };
    if (assigned.length > 0) check();
  }, [assigned]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-md shadow-teal-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">{t('app.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'عربي' : 'English'}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('student.homework.assigned')}</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : assigned.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assigned.map((hw) => {
              const completed = completedIds.has(hw.homework.id);
              const title = lang === 'ar' ? (hw.homework.title_ar || hw.homework.title_en) : (hw.homework.title_en || hw.homework.title_ar);
              const desc = lang === 'ar' ? (hw.homework.description_ar || hw.homework.description_en) : (hw.homework.description_en || hw.homework.description_ar);

              return (
                <div
                  key={hw.assignment_id}
                  className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                    completed ? 'border-emerald-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    {completed && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <Trophy className="w-3 h-3" />
                        {t('student.homework.completed')}
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{desc}</p>}

                  {completed ? (
                    <button
                      onClick={() => onViewResults(hw.homework.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl transition-all text-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      {t('common.score')}
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartHomework(hw.homework.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all shadow-md shadow-teal-200 text-sm active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4" />
                      {t('student.homework.start')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
