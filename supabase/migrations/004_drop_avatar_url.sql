-- Remove the avatar_url column.
-- avatarUrl is now computed at read time by signing avatar_storage_path via
-- supabaseAdmin.storage.createSignedUrl(). Storing the URL is redundant and
-- would go stale the moment the bucket was made private.
-- Run this in the Supabase SQL Editor after applying storage_rls_policies.sql.

ALTER TABLE sites DROP COLUMN IF EXISTS avatar_url;
