import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Lang } from '../lib/types';

interface LangState {
  lang: Lang;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangState | undefined>(undefined);

const translations: Record<string, Record<Lang, string>> = {
  'app.title': { en: 'Homework Hub', ar: 'مركز الواجبات' },
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'nav.students': { en: 'Students', ar: 'الطلاب' },
  'nav.homework': { en: 'Homework', ar: 'الواجبات' },
  'nav.submissions': { en: 'Submissions', ar: 'الإجابات' },
  'nav.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'nav.register': { en: 'Register', ar: 'إنشاء حساب' },
  'common.save': { en: 'Save', ar: 'حفظ' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.create': { en: 'Create', ar: 'إنشاء' },
  'common.next': { en: 'Next', ar: 'التالي' },
  'common.finish': { en: 'Finish', ar: 'إنهاء' },
  'common.back': { en: 'Back', ar: 'رجوع' },
  'common.correct': { en: 'Correct!', ar: 'صحيح!' },
  'common.wrong': { en: 'Wrong!', ar: 'خطأ!' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.noData': { en: 'No data found', ar: 'لا توجد بيانات' },
  'common.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'common.password': { en: 'Password', ar: 'كلمة المرور' },
  'common.name': { en: 'Full Name', ar: 'الاسم الكامل' },
  'common.actions': { en: 'Actions', ar: 'إجراءات' },
  'common.score': { en: 'Score', ar: 'النتيجة' },
  'common.status': { en: 'Status', ar: 'الحالة' },
  'common.yes': { en: 'Yes', ar: 'نعم' },
  'common.no': { en: 'No', ar: 'لا' },
  'login.title': { en: 'Welcome Back', ar: 'مرحبا بعودتك' },
  'login.subtitle': { en: 'Sign in to your account', ar: 'سجل الدخول إلى حسابك' },
  'login.button': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'login.noAccount': { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  'register.title': { en: 'Create Account', ar: 'إنشاء حساب' },
  'register.subtitle': { en: 'Sign up to get started', ar: 'سجل للبدء' },
  'register.button': { en: 'Sign Up', ar: 'تسجيل' },
  'register.hasAccount': { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  'admin.students.title': { en: 'Manage Students', ar: 'إدارة الطلاب' },
  'admin.students.add': { en: 'Add Student', ar: 'إضافة طالب' },
  'admin.homework.title': { en: 'Manage Homework', ar: 'إدارة الواجبات' },
  'admin.homework.add': { en: 'Add Homework', ar: 'إضافة واجب' },
  'admin.homework.questions': { en: 'Questions', ar: 'الأسئلة' },
  'admin.homework.assign': { en: 'Assign to Students', ar: 'تعيين للطلاب' },
  'admin.questions.title': { en: 'Manage Questions', ar: 'إدارة الأسئلة' },
  'admin.questions.add': { en: 'Add Question', ar: 'إضافة سؤال' },
  'admin.questions.video': { en: 'Video URL', ar: 'رابط الفيديو' },
  'admin.questions.imageA': { en: 'Image A', ar: 'الصورة أ' },
  'admin.questions.imageB': { en: 'Image B', ar: 'الصورة ب' },
  'admin.questions.imageC': { en: 'Image C', ar: 'الصورة ج' },
  'admin.questions.imageD': { en: 'Image D', ar: 'الصورة د' },
  'admin.questions.correct': { en: 'Correct Answer', ar: 'الإجابة الصحيحة' },
  'admin.questions.order': { en: 'Order', ar: 'الترتيب' },
  'admin.submissions.title': { en: 'Submissions', ar: 'الإجابات' },
  'admin.submissions.student': { en: 'Student', ar: 'الطالب' },
  'admin.submissions.homework': { en: 'Homework', ar: 'الواجب' },
  'admin.submissions.correctCount': { en: 'Correct', ar: 'صحيح' },
  'admin.submissions.wrongCount': { en: 'Wrong', ar: 'خطأ' },
  'admin.submissions.total': { en: 'Total', ar: 'المجموع' },
  'student.homework.assigned': { en: 'My Homework', ar: 'واجباتي' },
  'student.homework.start': { en: 'Start', ar: 'ابدأ' },
  'student.homework.completed': { en: 'Completed', ar: 'مكتمل' },
  'student.homework.inProgress': { en: 'In Progress', ar: 'قيد التنفيذ' },
  'student.question.of': { en: 'of', ar: 'من' },
  'student.question.selectAnswer': { en: 'Select your answer', ar: 'اختر إجابتك' },
  'student.result.title': { en: 'Your Results', ar: 'نتائجك' },
  'student.result.score': { en: 'Your Score', ar: 'نتيجتك' },
  'homework.titleEn': { en: 'Title (English)', ar: 'العنوان (إنجليزي)' },
  'homework.titleAr': { en: 'Title (Arabic)', ar: 'العنوان (عربي)' },
  'homework.descEn': { en: 'Description (English)', ar: 'الوصف (إنجليزي)' },
  'homework.descAr': { en: 'Description (Arabic)', ar: 'الوصف (عربي)' },
  'question.textEn': { en: 'Question Text (English)', ar: 'نص السؤال (إنجليزي)' },
  'question.textAr': { en: 'Question Text (Arabic)', ar: 'نص السؤال (عربي)' },
  'upload.image': { en: 'Upload Image', ar: 'رفع صورة' },
  'assign.selectStudents': { en: 'Select Students', ar: 'اختر الطلاب' },
  'assign.assign': { en: 'Assign', ar: 'تعيين' },
};

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'ar';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

  const t = (key: string): string => {
    const entry = translations[key];
    if (entry) return entry[lang];
    return key;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
