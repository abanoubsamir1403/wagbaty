import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { BookOpen, Globe } from 'lucide-react';

export function RegisterPage({ onSwitchLogin }: { onSwitchLogin: () => void }) {
  const { signUp } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signUp(email, password, name);
    if (err) setError(err);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
      <button
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all text-sm font-medium text-slate-600"
      >
        <Globe className="w-4 h-4" />
        {lang === 'en' ? 'عربي' : 'English'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-white mb-4 shadow-lg shadow-teal-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{t('register.title')}</h1>
          <p className="text-slate-500 mt-2">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm">
              Account created! You can now sign in.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200 hover:shadow-teal-300 active:scale-[0.98]"
          >
            {loading ? t('common.loading') : t('register.button')}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500">
          {t('register.hasAccount')}{' '}
          <button onClick={onSwitchLogin} className="text-teal-600 font-semibold hover:underline">
            {t('nav.login')}
          </button>
        </p>
      </div>
    </div>
  );
}
