-- Run this in Supabase SQL Editor → New Query
-- Hardens storage buckets to private (owner-only read).
-- Re-apply idempotently: drop existing policies first, then recreate.

-- ════════════════════════════════════════════════
-- Step 1: Flip buckets to private
-- Without this, Supabase CDN bypasses RLS for SELECT regardless of policies.
-- ════════════════════════════════════════════════
UPDATE storage.buckets
SET public = false
WHERE id IN ('avatars', 'screenshots');

-- ════════════════════════════════════════════════
-- Step 2: Drop existing policies (idempotent re-apply)
-- ════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can upload their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars"               ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar"       ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own screenshots"  ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots"  ON storage.objects;
DROP POLICY IF EXISTS "Public can view screenshots"             ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own screenshots"    ON storage.objects;

-- ════════════════════════════════════════════════
-- AVATARS bucket
-- ════════════════════════════════════════════════

-- Allow authenticated users to upload/replace their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only the owning user may read their own avatar (private bucket — no public access)
CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ════════════════════════════════════════════════
-- SCREENSHOTS bucket
-- ════════════════════════════════════════════════

-- Allow authenticated users to upload screenshots to their own folder
CREATE POLICY "Users can upload their own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own screenshots
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only the owning user may read their own screenshots (private bucket — no public access)
CREATE POLICY "Users can view their own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
