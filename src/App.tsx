import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider, useLang } from './contexts/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { HomeworkPlayer } from './pages/student/HomeworkPlayer';
import { HomeworkResults } from './pages/student/HomeworkResults';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const { lang, dir } = useLang();
  const [page, setPage] = useState<'login' | 'register' | 'dashboard' | 'homework' | 'results'>('login');
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [resultsHomeworkId, setResultsHomeworkId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    if (!user) setPage('login');
    else setPage('dashboard');
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (page === 'register') {
      return <RegisterPage onSwitchLogin={() => setPage('login')} />;
    }
    return <LoginPage onSwitchRegister={() => setPage('register')} />;
  }

  if (profile?.role === 'admin') {
    return (
      <AdminDashboard
        onLogout={() => {
          supabase.auth.signOut();
          setPage('login');
        }}
      />
    );
  }

  if (page === 'homework' && selectedHomeworkId) {
    return (
      <HomeworkPlayer
        homeworkId={selectedHomeworkId}
        onFinish={() => {
          setResultsHomeworkId(selectedHomeworkId);
          setSelectedHomeworkId(null);
          setPage('results');
        }}
        onBack={() => setPage('dashboard')}
      />
    );
  }

  if (page === 'results' && resultsHomeworkId) {
    return (
      <HomeworkResults
        homeworkId={resultsHomeworkId}
        onBack={() => {
          setResultsHomeworkId(null);
          setPage('dashboard');
        }}
      />
    );
  }

  return (
    <StudentDashboard
      onStartHomework={(id) => {
        setSelectedHomeworkId(id);
        setPage('homework');
      }}
      onViewResults={(id) => {
        setResultsHomeworkId(id);
        setPage('results');
      }}
      onLogout={() => {
        supabase.auth.signOut();
        setPage('login');
      }}
    />
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LangProvider>
  );
}
