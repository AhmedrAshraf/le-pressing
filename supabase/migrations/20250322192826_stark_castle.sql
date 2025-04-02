/*
  # Création des tables pour la gestion des événements

  1. Nouvelles Tables
    - `events`
      - `id` (uuid, clé primaire)
      - `title` (text, non null)
      - `start_date` (date, non null)
      - `start_time` (time, non null)
      - `end_date` (date, non null)
      - `end_time` (time, non null)
      - `created_at` (timestamp avec fuseau horaire)
      - `updated_at` (timestamp avec fuseau horaire)
    
    - `events_history`
      - `id` (uuid, clé primaire)
      - `event_id` (uuid, clé étrangère vers events)
      - `field` (text, non null)
      - `old_value` (text, non null)
      - `new_value` (text, non null)
      - `modified_at` (timestamp avec fuseau horaire)
      - `modified_by` (uuid, clé étrangère vers auth.users)

  2. Sécurité
    - RLS activé sur les deux tables
    - Politiques pour permettre uniquement aux administrateurs authentifiés de modifier les événements
    - Politiques de lecture publique pour les événements
*/

-- Création de la table des événements
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_date date NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création de la table d'historique
CREATE TABLE IF NOT EXISTS events_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text NOT NULL,
  new_value text NOT NULL,
  modified_at timestamptz DEFAULT now(),
  modified_by uuid REFERENCES auth.users(id)
);

-- Activation de la RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_history ENABLE ROW LEVEL SECURITY;

-- Création d'une fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques pour la table events
CREATE POLICY "Lecture publique des événements"
  ON events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Modification des événements par les administrateurs"
  ON events
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Politiques pour la table events_history
CREATE POLICY "Lecture de l'historique par les administrateurs"
  ON events_history
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Création d'historique par les administrateurs"
  ON events_history
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Trigger pour mettre à jour l'historique
CREATE OR REPLACE FUNCTION log_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.start_date != NEW.start_date THEN
      INSERT INTO events_history (event_id, field, old_value, new_value, modified_by)
      VALUES (NEW.id, 'start_date', OLD.start_date::text, NEW.start_date::text, auth.uid());
    END IF;
    
    IF OLD.start_time != NEW.start_time THEN
      INSERT INTO events_history (event_id, field, old_value, new_value, modified_by)
      VALUES (NEW.id, 'start_time', OLD.start_time::text, NEW.start_time::text, auth.uid());
    END IF;
    
    IF OLD.end_date != NEW.end_date THEN
      INSERT INTO events_history (event_id, field, old_value, new_value, modified_by)
      VALUES (NEW.id, 'end_date', OLD.end_date::text, NEW.end_date::text, auth.uid());
    END IF;
    
    IF OLD.end_time != NEW.end_time THEN
      INSERT INTO events_history (event_id, field, old_value, new_value, modified_by)
      VALUES (NEW.id, 'end_time', OLD.end_time::text, NEW.end_time::text, auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_audit
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION log_event_changes();