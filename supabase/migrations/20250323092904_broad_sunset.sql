/*
  # Création d'un événement de test et sa configuration

  1. Nouvelles données
    - Un événement de test
    - Les paramètres de réservation associés
*/

-- Création d'un événement de test
INSERT INTO events (
  title,
  start_date,
  start_time,
  end_date,
  end_time,
  image_url
) VALUES (
  'Soirée Test - Open Mic',
  '2025-04-01',
  '20:00',
  '2025-04-01',
  '22:00',
  'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1200&h=600&q=80'
);

-- Récupération de l'ID de l'événement créé
DO $$
DECLARE
  event_id uuid;
BEGIN
  SELECT id INTO event_id FROM events WHERE title = 'Soirée Test - Open Mic' LIMIT 1;
  
  -- Configuration des paramètres de réservation
  INSERT INTO booking_settings (
    event_id,
    max_seats,
    seats_per_booking,
    booking_deadline
  ) VALUES (
    event_id,
    50,  -- Capacité totale
    6,   -- Maximum de places par réservation
    '1 hour'::interval
  );
END $$;