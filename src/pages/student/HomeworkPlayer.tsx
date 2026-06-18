import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import type { Question, Submission } from '../../lib/types';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    let videoId = '';
    // youtube.com/watch?v=ID
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com' || u.hostname === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v') || '';
      }
      // youtube.com/shorts/ID
      else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1]?.split('?')[0] || '';
      }
      // Already embed
      else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1]?.split('?')[0] || '';
      }
    }
    // youtu.be/ID
    else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url;
}

export function HomeworkPlayer({
  homeworkId,
  onFinish,
  onBack,
}: {
  homeworkId: string;
  onFinish: () => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('homework_id', homeworkId)
        .order('order_index', { ascending: true });
      setQuestions(qs || []);

      if (user) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('homework_id', homeworkId)
          .eq('student_id', user.id);
        setSubmissions(subs || []);

        // Find first unanswered question
        const answeredIds = new Set((subs || []).map((s) => s.question_id));
        const firstUnanswered = (qs || []).findIndex((q) => !answeredIds.has(q.id));
        setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : (qs || []).length - 1);
      }
      setLoading(false);
    };
    fetch();
  }, [homeworkId, user]);

  const currentQuestion = questions[currentIndex];
  const alreadyAnswered = currentQuestion ? submissions.some((s) => s.question_id === currentQuestion.id) : false;

  const handleSelect = (answer: 'a' | 'b' | 'c' | 'd') => {
    if (showResult || alreadyAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || !user) return;
    setSubmitting(true);
    const correct = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    const { data: newSub } = await supabase
      .from('submissions')
      .insert({
        homework_id: homeworkId,
        student_id: user.id,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        is_correct: correct,
      })
      .select()
      .maybeSingle();

    if (newSub) {
      setSubmissions((prev) => [...prev, newSub]);
    }
    setSubmitting(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      onFinish();
    }
  };

  const getImageUrl = (letter: 'a' | 'b' | 'c' | 'd') => {
    if (!currentQuestion) return '';
    return currentQuestion[`image_${letter}_url` as keyof Question] as string;
  };

  const getSubmissionForQuestion = (questionId: string) => {
    return submissions.find((s) => s.question_id === questionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-500 mb-4">{t('common.noData')}</p>
        <button onClick={onBack} className="px-4 py-2 bg-teal-500 text-white rounded-xl">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const prevSub = getSubmissionForQuestion(currentQuestion.id);
  const isLastQuestion = currentIndex === questions.length - 1;

  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              <BackArrow className="w-4 h-4" />
              {t('common.back')}
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {currentIndex + 1} {t('student.question.of')} {questions.length}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((submissions.length) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Video */}
        {currentQuestion.video_url && (
          <div className="mb-6 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
            <div className="aspect-video">
              <iframe
                src={toEmbedUrl(currentQuestion.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Question text */}
        {(currentQuestion.question_text_en || currentQuestion.question_text_ar) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {lang === 'ar' ? (currentQuestion.question_text_ar || currentQuestion.question_text_en) : (currentQuestion.question_text_en || currentQuestion.question_text_ar)}
            </h2>
          </div>
        )}

        <p className="text-sm text-slate-500 mb-4">{t('student.question.selectAnswer')}</p>

        {/* Answer choices */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(['a', 'b', 'c', 'd'] as const).map((letter) => {
            const url = getImageUrl(letter);
            const isSelected = selectedAnswer === letter || prevSub?.selected_answer === letter;
            const isCorrectAnswer = currentQuestion.correct_answer === letter;
            const showCorrectness = showResult || alreadyAnswered;

            let borderClass = 'border-slate-200 hover:border-teal-300 hover:shadow-md';
            if (showCorrectness) {
              if (isCorrectAnswer) borderClass = 'border-emerald-400 ring-2 ring-emerald-200';
              else if (isSelected && !isCorrectAnswer) borderClass = 'border-red-400 ring-2 ring-red-200';
              else borderClass = 'border-slate-200 opacity-60';
            } else if (isSelected) {
              borderClass = 'border-teal-500 ring-2 ring-teal-200';
            }

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={showCorrectness}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${borderClass} active:scale-[0.97]`}
              >
                <img
                  src={url}
                  alt={`Choice ${letter.toUpperCase()}`}
                  className="w-full aspect-square object-cover"
                />
                <span className="absolute top-2 start-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm">
                  {letter.toUpperCase()}
                </span>
                {showCorrectness && isCorrectAnswer && (
                  <div className="absolute bottom-2 end-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-lg" />
                  </div>
                )}
                {showCorrectness && isSelected && !isCorrectAnswer && (
                  <div className="absolute bottom-2 end-2">
                    <XCircle className="w-8 h-8 text-red-500 drop-shadow-lg" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Result feedback */}
        {(showResult || alreadyAnswered) && (
          <div
            className={`mb-6 px-5 py-4 rounded-2xl text-center font-bold text-lg animate-[fadeIn_0.3s_ease] ${
              (showResult && isCorrect) || (alreadyAnswered && prevSub?.is_correct)
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {(showResult && isCorrect) || (alreadyAnswered && prevSub?.is_correct)
              ? t('common.correct')
              : t('common.wrong')}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          {!showResult && !alreadyAnswered && selectedAnswer && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-200 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('common.next')}
            </button>
          )}
          {(showResult || alreadyAnswered) && (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-200 active:scale-[0.98]"
            >
              {isLastQuestion ? t('common.finish') : t('common.next')}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
