/*
  # Ajout du support des paiements

  1. Nouvelles Tables
    - `payments`
      - `id` (uuid, clé primaire)
      - `booking_id` (uuid, référence vers bookings)
      - `amount` (int, montant en centimes)
      - `currency` (text, devise)
      - `status` (enum, statut du paiement)
      - `stripe_payment_intent_id` (text, ID Stripe)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications
    - Ajout de la colonne `payment_id` à la table `bookings`
    - Ajout de la colonne `price` à la table `events`

  3. Sécurité
    - RLS activé sur la table payments
    - Politiques de lecture/écriture appropriées
*/

-- Type pour le statut des paiements
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded'
);

-- Table des paiements
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount int NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'eur',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_currency CHECK (currency = lower(currency))
);

-- Ajout du prix aux événements
ALTER TABLE events
ADD COLUMN price int NOT NULL DEFAULT 1500; -- 15€ par défaut

-- Ajout de la référence au paiement dans les réservations
ALTER TABLE bookings
ADD COLUMN payment_id uuid REFERENCES payments(id);

-- Activation de RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Politiques pour les paiements
CREATE POLICY "Lecture des paiements par email"
  ON payments
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.payment_id = payments.id
      AND bookings.user_email = current_user
    )
  );

CREATE POLICY "Lecture des paiements par les administrateurs"
  ON payments
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestion des paiements par les administrateurs"
  ON payments
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index pour améliorer les performances
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);