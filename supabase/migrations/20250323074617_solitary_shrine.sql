/*
  # Mise à jour des identifiants administrateur

  1. Changements
    - Mise à jour du mot de passe administrateur pour plus de sécurité
    - Confirmation de l'email pour éviter les problèmes d'authentification

  2. Sécurité
    - Utilisation de crypt() pour le hachage du mot de passe
    - Mise à jour sécurisée avec condition sur l'email
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('PressAdmin2025!', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'admin@lepressing.fr';