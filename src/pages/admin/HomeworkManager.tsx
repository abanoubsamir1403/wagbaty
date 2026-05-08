import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import type { Homework, Question, Profile } from '../../lib/types';
import { Plus, Trash2, CreditCard as Edit3, ChevronRight, ChevronLeft, Upload, X, Users, Check } from 'lucide-react';

type View = 'list' | 'edit' | 'questions' | 'assign';

export function HomeworkManager() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title_en: '', title_ar: '', description_en: '', description_ar: '' });
  const [saving, setSaving] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Partial<Question> | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Assign state
  const [students, setStudents] = useState<Profile[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const fetchHomeworks = async () => {
    setLoading(true);
    const { data } = await supabase.from('homeworks').select('*').order('created_at', { ascending: false });
    setHomeworks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHomeworks(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editId) {
      await supabase.from('homeworks').update(form).eq('id', editId);
    } else {
      await supabase.from('homeworks').insert({ ...form, created_by: profile?.id });
    }
    setForm({ title_en: '', title_ar: '', description_en: '', description_ar: '' });
    setEditId(null);
    setView('list');
    fetchHomeworks();
    setSaving(false);
  };

  const handleEdit = (hw: Homework) => {
    setForm({
      title_en: hw.title_en,
      title_ar: hw.title_ar,
      description_en: hw.description_en || '',
      description_ar: hw.description_ar || '',
    });
    setEditId(hw.id);
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this homework and all its questions?')) return;
    await supabase.from('homeworks').delete().eq('id', id);
    fetchHomeworks();
  };

  const openQuestions = async (hwId: string) => {
    setView('questions');
    setEditId(hwId);
    setQuestionsLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('homework_id', hwId)
      .order('order_index', { ascending: true });
    setQuestions(data || []);
    setQuestionsLoading(false);
  };

  const uploadImage = async (file: File, field: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${editId}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('question-images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('question-images').getPublicUrl(path);
    return publicUrl;
  };

  const handleImageUpload = async (file: File, field: 'image_a_url' | 'image_b_url' | 'image_c_url' | 'image_d_url') => {
    if (!editQuestion) return;
    setUploading(field);
    try {
      const url = await uploadImage(file, field);
      setEditQuestion({ ...editQuestion, [field]: url });
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(null);
  };

  const saveQuestion = async () => {
    if (!editQuestion || !editId) return;
    const q = {
      homework_id: editId,
      order_index: editQuestion.order_index || 0,
      video_url: editQuestion.video_url || '',
      image_a_url: editQuestion.image_a_url || '',
      image_b_url: editQuestion.image_b_url || '',
      image_c_url: editQuestion.image_c_url || '',
      image_d_url: editQuestion.image_d_url || '',
      correct_answer: editQuestion.correct_answer || 'a',
      question_text_en: editQuestion.question_text_en || '',
      question_text_ar: editQuestion.question_text_ar || '',
    };

    if (editQuestion.id) {
      await supabase.from('questions').update(q).eq('id', editQuestion.id);
    } else {
      await supabase.from('questions').insert(q);
    }
    setEditQuestion(null);
    openQuestions(editId);
  };

  const deleteQuestion = async (id: string) => {
    if (!editId) return;
    await supabase.from('questions').delete().eq('id', id);
    openQuestions(editId);
  };

  const openAssign = async (hwId: string) => {
    setView('assign');
    setEditId(hwId);
    const { data: studs } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name');
    setStudents(studs || []);
    const { data: assigns } = await supabase.from('homework_assignments').select('student_id').eq('homework_id', hwId);
    setAssignedIds(new Set((assigns || []).map((a) => a.student_id)));
  };

  const toggleAssign = async (studentId: string) => {
    if (!editId) return;
    if (assignedIds.has(studentId)) {
      await supabase.from('homework_assignments').delete().eq('homework_id', editId).eq('student_id', studentId);
      setAssignedIds((prev) => { const n = new Set(prev); n.delete(studentId); return n; });
    } else {
      await supabase.from('homework_assignments').insert({ homework_id: editId, student_id: studentId });
      setAssignedIds((prev) => { const n = new Set(prev); n.add(studentId); return n; });
    }
  };

  const Arrow = lang === 'ar' ? ChevronLeft : ChevronRight;

  if (view === 'edit') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {editId ? t('common.edit') : t('admin.homework.add')}
        </h2>
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('homework.titleEn')}</label>
              <input
                type="text"
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('homework.titleAr')}</label>
              <input
                type="text"
                value={form.title_ar}
                onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                required
                dir="rtl"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('homework.descEn')}</label>
              <textarea
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('homework.descAr')}</label>
              <textarea
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                rows={3}
                dir="rtl"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all disabled:opacity-50">
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button type="button" onClick={() => { setView('list'); setEditId(null); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'questions' && editId) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView('list'); setEditId(null); setEditQuestion(null); }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
            <Arrow className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{t('admin.questions.title')}</h2>
        </div>

        <button
          onClick={() => setEditQuestion({ order_index: questions.length, correct_answer: 'a', image_a_url: '', image_b_url: '', image_c_url: '', image_d_url: '', video_url: '', question_text_en: '', question_text_ar: '' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all shadow-md shadow-teal-200 mb-6 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          {t('admin.questions.add')}
        </button>

        {editQuestion && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-[fadeIn_0.2s_ease]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('question.textEn')}</label>
                <input
                  type="text"
                  value={editQuestion.question_text_en || ''}
                  onChange={(e) => setEditQuestion({ ...editQuestion, question_text_en: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('question.textAr')}</label>
                <input
                  type="text"
                  value={editQuestion.question_text_ar || ''}
                  onChange={(e) => setEditQuestion({ ...editQuestion, question_text_ar: e.target.value })}
                  dir="rtl"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.questions.video')}</label>
                <input
                  type="url"
                  value={editQuestion.video_url || ''}
                  onChange={(e) => setEditQuestion({ ...editQuestion, video_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.questions.order')}</label>
                <input
                  type="number"
                  value={editQuestion.order_index || 0}
                  onChange={(e) => setEditQuestion({ ...editQuestion, order_index: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.questions.correct')}</label>
                <select
                  value={editQuestion.correct_answer || 'a'}
                  onChange={(e) => setEditQuestion({ ...editQuestion, correct_answer: e.target.value as 'a' | 'b' | 'c' | 'd' })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                const field = `image_${letter}_url` as 'image_a_url' | 'image_b_url' | 'image_c_url' | 'image_d_url';
                const label = t(`admin.questions.image${letter.toUpperCase()}`);
                return (
                  <div key={letter}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    {editQuestion[field] ? (
                      <div className="relative group">
                        <img
                          src={editQuestion[field] as string}
                          alt={label}
                          className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        />
                        <button
                          onClick={() => setEditQuestion({ ...editQuestion, [field]: '' })}
                          className="absolute top-1 end-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">{t('upload.image')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, field);
                          }}
                          disabled={uploading !== null}
                        />
                      </label>
                    )}
                    {uploading === field && (
                      <div className="mt-1 text-xs text-teal-600 animate-pulse">Uploading...</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={saveQuestion} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all">
                {t('common.save')}
              </button>
              <button onClick={() => setEditQuestion(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {questionsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t('common.noData')}</div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lang === 'ar' ? (q.question_text_ar || q.question_text_en) : (q.question_text_en || q.question_text_ar) || `Question ${i + 1}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('admin.questions.correct')}: {q.correct_answer.toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditQuestion({ ...q })}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'assign' && editId) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView('list'); setEditId(null); }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
            <Arrow className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{t('admin.homework.assign')}</h2>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t('common.noData')}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.full_name || '—'}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
                <button
                  onClick={() => toggleAssign(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    assignedIds.has(s.id)
                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {assignedIds.has(s.id) ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {assignedIds.has(s.id) ? t('common.yes') : t('assign.assign')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('admin.homework.title')}</h2>
        <button
          onClick={() => { setEditId(null); setForm({ title_en: '', title_ar: '', description_en: '', description_ar: '' }); setView('edit'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-all shadow-md shadow-teal-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          {t('admin.homework.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : homeworks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">{t('common.noData')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworks.map((hw) => (
            <div key={hw.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {lang === 'ar' ? (hw.title_ar || hw.title_en) : (hw.title_en || hw.title_ar)}
              </h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                {lang === 'ar' ? (hw.description_ar || hw.description_en) : (hw.description_en || hw.description_ar) || '—'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openQuestions(hw.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  {t('admin.homework.questions')}
                  <Arrow className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openAssign(hw.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  {t('admin.homework.assign')}
                </button>
                <button
                  onClick={() => handleEdit(hw)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(hw.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
