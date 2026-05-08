/*
  # Create default admin user

  1. Creates the admin user in auth.users
  2. Creates the admin profile in profiles table with role = 'admin'
  3. Email confirmation is bypassed

  Important Notes:
    - The admin email is abanoubsamir2811@gmail.com
    - The password is set via auth.users encrypted password field
    - Email is auto-confirmed
*/

-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'abanoubsamir2811@gmail.com',
  crypt('12345678Me*', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create admin profile
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Admin', 'admin'
FROM auth.users
WHERE email = 'abanoubsamir2811@gmail.com'
ON CONFLICT (id) DO NOTHING;
