/*
  # Initial Schema for Bilingual Homework App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text, default 'student')
      - `created_at` (timestamptz)
    - `homeworks`
      - `id` (uuid, primary key)
      - `title_en` (text)
      - `title_ar` (text)
      - `description_en` (text, nullable)
      - `description_ar` (text, nullable)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
    - `questions`
      - `id` (uuid, primary key)
      - `homework_id` (uuid, references homeworks)
      - `order_index` (integer)
      - `video_url` (text, nullable)
      - `image_a_url` (text)
      - `image_b_url` (text)
      - `image_c_url` (text)
      - `image_d_url` (text)
      - `correct_answer` (text, one of 'a','b','c','d')
      - `question_text_en` (text, nullable)
      - `question_text_ar` (text, nullable)
      - `created_at` (timestamptz)
    - `homework_assignments`
      - `id` (uuid, primary key)
      - `homework_id` (uuid, references homeworks)
      - `student_id` (uuid, references profiles)
      - `assigned_at` (timestamptz)
    - `submissions`
      - `id` (uuid, primary key)
      - `homework_id` (uuid, references homeworks)
      - `student_id` (uuid, references profiles)
      - `question_id` (uuid, references questions)
      - `selected_answer` (text, one of 'a','b','c','d')
      - `is_correct` (boolean)
      - `submitted_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admins can CRUD all tables
    - Students can read assigned homeworks, questions
    - Students can insert their own submissions
    - Students can read their own submissions

  3. Important Notes
    - The `profiles` table `role` column determines admin vs student access
    - Admin role is checked via profiles table, not auth metadata
    - Unique constraint on homework_assignments prevents duplicate assignments
    - Unique constraint on submissions per student per question prevents re-answering
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz DEFAULT now()
);

-- Homeworks table
CREATE TABLE IF NOT EXISTS homeworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_en text DEFAULT '',
  description_ar text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  video_url text DEFAULT '',
  image_a_url text NOT NULL DEFAULT '',
  image_b_url text NOT NULL DEFAULT '',
  image_c_url text NOT NULL DEFAULT '',
  image_d_url text NOT NULL DEFAULT '',
  correct_answer text NOT NULL DEFAULT 'a' CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  question_text_en text DEFAULT '',
  question_text_ar text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Homework assignments table
CREATE TABLE IF NOT EXISTS homework_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct boolean NOT NULL DEFAULT false,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(student_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or the owner
CREATE OR REPLACE FUNCTION is_admin_or_self(user_id uuid, check_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND (role = 'admin' OR id = check_id));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Homeworks policies
CREATE POLICY "Authenticated users can read homeworks"
  ON homeworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert homeworks"
  ON homeworks FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update homeworks"
  ON homeworks FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete homeworks"
  ON homeworks FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Questions policies
CREATE POLICY "Authenticated users can read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Homework assignments policies
CREATE POLICY "Admins can read all assignments"
  ON homework_assignments FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR student_id = auth.uid());

CREATE POLICY "Admins can insert assignments"
  ON homework_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete assignments"
  ON homework_assignments FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Submissions policies
CREATE POLICY "Students can read own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Students can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can delete submissions"
  ON submissions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_homework_id ON questions(homework_id);
CREATE INDEX IF NOT EXISTS idx_assignments_homework_id ON homework_assignments(homework_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON homework_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_homework_id ON submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question_id ON submissions(question_id);
