-- Add avatar_storage_path column to sites table
-- Run this in the Supabase SQL Editor after 001_create_sites.sql

ALTER TABLE sites ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;
