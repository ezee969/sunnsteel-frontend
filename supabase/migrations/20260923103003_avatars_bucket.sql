-- PROF-01: the avatars bucket and who may write to it.
--
-- Settings uploads a member's cropped photo to `avatars/<auth uid>/<file>` and
-- stores the public URL in User.avatarUrl. Until this migration the bucket did
-- not exist in the project (0 buckets, 0 objects on 2026-09-23), so every
-- upload failed with "Bucket not found".
--
-- Reads are public: a public bucket serves /storage/v1/object/public/avatars/*
-- without consulting RLS, which is what an <img> on another member's profile
-- needs. Writes are not: the policies below let a signed-in member insert,
-- replace, list and delete only objects inside the folder named after their
-- own Supabase user id. The folder is the auth uid, not the local User.id,
-- because auth.uid() is the only identity RLS can see.
--
-- The service role bypasses RLS; the backend uses it to remove a deleted
-- member's folder (TRUST-01, SupabaseService.removeStoredAvatars).
--
-- Idempotent: safe to run again.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MiB; the cropper exports at most 512x512 JPEG, well under it
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: members list their own folder" on storage.objects;
create policy "avatars: members list their own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: members upload into their own folder" on storage.objects;
create policy "avatars: members upload into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: members replace their own files" on storage.objects;
create policy "avatars: members replace their own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: members delete their own files" on storage.objects;
create policy "avatars: members delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
