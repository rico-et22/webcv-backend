-- Module 3: Sites table
-- Run this once in the Supabase SQL Editor before using the /sites endpoints.

CREATE TABLE IF NOT EXISTS sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  job_title     TEXT,
  location      TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  contacts      JSONB    NOT NULL DEFAULT '{}',
  skills        TEXT[]   NOT NULL DEFAULT '{}',
  experience    JSONB    NOT NULL DEFAULT '[]'::jsonb,
  education     JSONB    NOT NULL DEFAULT '[]'::jsonb,
  projects      JSONB    NOT NULL DEFAULT '[]'::jsonb,
  achievements  JSONB    NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);

-- Row-Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own sites" ON sites;
CREATE POLICY "Users can manage own sites"
  ON sites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
