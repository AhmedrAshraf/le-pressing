/*
  # Update storage configuration with new limits

  1. Changes
    - Update storage bucket configuration with new file size limit (5MB)
    - Update allowed MIME types
*/

-- Update bucket configuration
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880, -- 5MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'events';