/*
  # Création du compte administrateur

  1. Création de l'utilisateur
    - Crée un utilisateur avec le rôle admin
    - Email : admin@lepressing.fr
    - Mot de passe : admin123

  2. Configuration
    - Définit le rôle "admin" dans les métadonnées
    - Active le compte sans confirmation d'email
*/

-- Création de l'utilisateur admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
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
  'admin@lepressing.fr',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);