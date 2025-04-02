/*
  # Storage configuration and RLS policies

  1. Storage Configuration
    - Create storage bucket 'events' for storing event images
    - Enable public access for image display
    - Enable RLS on storage.objects table

  2. Security Policies
    - Admin users can upload/update/delete images
    - Public read access for all images
*/

-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy for authenticated admin users to upload files
create policy "Admin users can upload event images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'events'
  and is_admin(auth.uid())
);

-- Policy for authenticated admin users to update files
create policy "Admin users can update event images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'events'
  and is_admin(auth.uid())
);

-- Policy for authenticated admin users to delete files
create policy "Admin users can delete event images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'events'
  and is_admin(auth.uid())
);

-- Policy for public access to read files
create policy "Public can view event images"
on storage.objects for select
to public
using (bucket_id = 'events');