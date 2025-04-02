/*
  # Système de réservation

  1. Nouvelles Tables
    - `bookings`
      - `id` (uuid, clé primaire)
      - `event_id` (uuid, référence vers events)
      - `user_email` (text, email du client)
      - `user_name` (text, nom du client)
      - `user_phone` (text, téléphone du client)
      - `seats` (int, nombre de places)
      - `status` (enum, statut de la réservation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `reminder_sent` (boolean)
    
    - `booking_settings`
      - `id` (uuid, clé primaire)
      - `event_id` (uuid, référence vers events)
      - `max_seats` (int, capacité maximale)
      - `seats_per_booking` (int, places max par réservation)
      - `booking_deadline` (interval, délai limite avant l'événement)

  2. Types et énumérations
    - Status des réservations
    - Configuration des délais

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture/écriture appropriées
*/

-- Création du type pour le statut des réservations
CREATE TYPE booking_status AS ENUM (
  'pending',    -- En attente de confirmation
  'confirmed',  -- Confirmée
  'cancelled',  -- Annulée
  'completed'   -- Terminée (après l'événement)
);

-- Table des réservations
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text NOT NULL,
  user_phone text NOT NULL,
  seats int NOT NULL CHECK (seats > 0),
  status booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reminder_sent boolean DEFAULT false,
  
  -- Contraintes
  CONSTRAINT valid_email CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (user_phone ~* '^\+?[0-9]{10,}$')
);

-- Table des paramètres de réservation
CREATE TABLE booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  max_seats int NOT NULL CHECK (max_seats > 0),
  seats_per_booking int NOT NULL CHECK (seats_per_booking > 0),
  booking_deadline interval NOT NULL DEFAULT '1 hour',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour les réservations
CREATE POLICY "Lecture publique des réservations par email"
  ON bookings
  FOR SELECT
  TO public
  USING (user_email = current_user);

CREATE POLICY "Création de réservations pour tous"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Modification de réservations par email"
  ON bookings
  FOR UPDATE
  TO public
  USING (user_email = current_user)
  WITH CHECK (user_email = current_user);

CREATE POLICY "Lecture des réservations par les administrateurs"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestion des réservations par les administrateurs"
  ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Politiques pour les paramètres de réservation
CREATE POLICY "Lecture publique des paramètres"
  ON booking_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Gestion des paramètres par les administrateurs"
  ON booking_settings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fonction pour vérifier la disponibilité
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_event_id uuid,
  p_seats int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_seats int;
  v_booked_seats int;
  v_seats_per_booking int;
  v_event_start timestamp;
  v_booking_deadline interval;
BEGIN
  -- Récupérer les paramètres de réservation
  SELECT 
    bs.max_seats,
    bs.seats_per_booking,
    bs.booking_deadline,
    (e.start_date + e.start_time::time)::timestamp
  INTO
    v_max_seats,
    v_seats_per_booking,
    v_booking_deadline,
    v_event_start
  FROM booking_settings bs
  JOIN events e ON e.id = bs.event_id
  WHERE bs.event_id = p_event_id;

  -- Vérifier si l'événement existe et est configurable
  IF v_max_seats IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier le délai de réservation
  IF now() > v_event_start - v_booking_deadline THEN
    RETURN false;
  END IF;

  -- Vérifier le nombre de places par réservation
  IF p_seats > v_seats_per_booking THEN
    RETURN false;
  END IF;

  -- Calculer le nombre total de places réservées
  SELECT COALESCE(SUM(seats), 0)
  INTO v_booked_seats
  FROM bookings
  WHERE event_id = p_event_id
  AND status IN ('pending', 'confirmed');

  -- Vérifier la disponibilité
  RETURN (v_booked_seats + p_seats) <= v_max_seats;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index pour améliorer les performances
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_user_email ON bookings(user_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);