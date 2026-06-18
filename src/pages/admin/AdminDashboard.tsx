import { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { StudentsManager } from './StudentsManager';
import { HomeworkManager } from './HomeworkManager';
import { SubmissionsViewer } from './SubmissionsViewer';
import { BookOpen, Users, ClipboardList, FileCheck, LogOut, Globe } from 'lucide-react';

type Tab = 'homework' | 'students' | 'submissions';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { t, lang, toggleLang } = useLang();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('homework');

  const tabs: { key: Tab; icon: typeof BookOpen; label: string }[] = [
    { key: 'homework', icon: ClipboardList, label: t('nav.homework') },
    { key: 'students', icon: Users, label: t('nav.students') },
    { key: 'submissions', icon: FileCheck, label: t('nav.submissions') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-md shadow-teal-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">{t('app.title')}</h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'عربي' : 'English'}
              </button>
              <span className="hidden sm:block text-sm text-slate-500">{profile?.email}</span>
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'homework' && <HomeworkManager />}
        {activeTab === 'students' && <StudentsManager />}
        {activeTab === 'submissions' && <SubmissionsViewer />}
      </main>
    </div>
  );
}
