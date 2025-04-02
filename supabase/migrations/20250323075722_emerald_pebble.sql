/*
  # Fix storage RLS policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate storage bucket with proper configuration
    - Enable RLS on storage.objects table
    - Create new policies with proper conditions

  2. Security
    - Admin users can upload/update/delete images
    - Public read access for all images
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin users can upload event images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin users can update event images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin users can delete event images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
END $$;

-- Recreate bucket if it doesn't exist
DELETE FROM storage.buckets WHERE id = 'events';
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated admin users to upload files
CREATE POLICY "Admin users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events'
  AND is_admin(auth.uid()) = true
);

-- Policy for authenticated admin users to update files
CREATE POLICY "Admin users can update event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'events'
  AND is_admin(auth.uid()) = true
)
WITH CHECK (
  bucket_id = 'events'
  AND is_admin(auth.uid()) = true
);

-- Policy for authenticated admin users to delete files
CREATE POLICY "Admin users can delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'events'
  AND is_admin(auth.uid()) = true
);

-- Policy for public access to read files
CREATE POLICY "Public can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');