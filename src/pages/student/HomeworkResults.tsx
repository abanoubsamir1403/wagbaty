import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import type { Submission, Question } from '../../lib/types';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy } from 'lucide-react';

export function HomeworkResults({
  homeworkId,
  onBack,
}: {
  homeworkId: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      const [subRes, qRes] = await Promise.all([
        supabase.from('submissions').select('*').eq('homework_id', homeworkId).eq('student_id', user.id),
        supabase.from('questions').select('*').eq('homework_id', homeworkId).order('order_index', { ascending: true }),
      ]);
      setSubmissions(subRes.data || []);
      setQuestions(qRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [homeworkId, user]);

  const correctCount = submissions.filter((s) => s.is_correct).length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              <BackArrow className="w-4 h-4" />
              {t('common.back')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-8">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${scorePercent >= 50 ? 'text-amber-400' : 'text-slate-300'}`} />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('student.result.score')}</h2>
          <div className="text-5xl font-black text-teal-600 mb-2">{scorePercent}%</div>
          <p className="text-slate-500">
            {correctCount} / {totalQuestions} {t('admin.submissions.correctCount')}
          </p>
        </div>

        {/* Question review */}
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t('admin.questions.title')}</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const sub = submissions.find((s) => s.question_id === q.id);
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 flex items-center gap-4 ${
                  sub?.is_correct ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lang === 'ar' ? (q.question_text_ar || q.question_text_en) : (q.question_text_en || q.question_text_ar) || `Question ${i + 1}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('admin.questions.correct')}: {q.correct_answer.toUpperCase()}
                    {sub && ` | ${t('common.email')}: ${sub.selected_answer.toUpperCase()}`}
                  </p>
                </div>
                {sub?.is_correct ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
