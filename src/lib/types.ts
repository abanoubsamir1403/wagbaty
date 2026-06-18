export type Role = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Homework {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  created_by: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  homework_id: string;
  order_index: number;
  video_url: string;
  image_a_url: string;
  image_b_url: string;
  image_c_url: string;
  image_d_url: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  question_text_en: string;
  question_text_ar: string;
  created_at: string;
}

export interface HomeworkAssignment {
  id: string;
  homework_id: string;
  student_id: string;
  assigned_at: string;
  student?: Profile;
  homework?: Homework;
}

export interface Submission {
  id: string;
  homework_id: string;
  student_id: string;
  question_id: string;
  selected_answer: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
  submitted_at: string;
}

export type Lang = 'en' | 'ar';
