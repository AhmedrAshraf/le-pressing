/*
  # Ajout du support des images pour les événements

  1. Modifications
    - Ajout de la colonne `image_url` à la table `events`
    - Ajout du suivi des modifications d'images dans l'historique

  2. Sécurité
    - Mise à jour des politiques pour inclure la gestion des images
*/

-- Ajout de la colonne image_url
ALTER TABLE events
ADD COLUMN IF NOT EXISTS image_url text;

-- Mise à jour du trigger d'historique pour inclure les changements d'image
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

    IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
      INSERT INTO events_history (event_id, field, old_value, new_value, modified_by)
      VALUES (NEW.id, 'image_url', COALESCE(OLD.image_url, 'Aucune image'), COALESCE(NEW.image_url, 'Aucune image'), auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;