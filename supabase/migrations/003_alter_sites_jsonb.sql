-- Cast existing JSONB[] (Postgres array of JSONB) to pure JSONB arrays
-- so that standard JSON path operations work and ORMs handle them correctly.

ALTER TABLE sites ALTER COLUMN experience DROP DEFAULT;
ALTER TABLE sites ALTER COLUMN experience TYPE JSONB USING array_to_json(experience)::jsonb;
ALTER TABLE sites ALTER COLUMN experience SET DEFAULT '[]'::jsonb;

ALTER TABLE sites ALTER COLUMN education DROP DEFAULT;
ALTER TABLE sites ALTER COLUMN education TYPE JSONB USING array_to_json(education)::jsonb;
ALTER TABLE sites ALTER COLUMN education SET DEFAULT '[]'::jsonb;

ALTER TABLE sites ALTER COLUMN projects DROP DEFAULT;
ALTER TABLE sites ALTER COLUMN projects TYPE JSONB USING array_to_json(projects)::jsonb;
ALTER TABLE sites ALTER COLUMN projects SET DEFAULT '[]'::jsonb;

ALTER TABLE sites ALTER COLUMN achievements DROP DEFAULT;
ALTER TABLE sites ALTER COLUMN achievements TYPE JSONB USING array_to_json(achievements)::jsonb;
ALTER TABLE sites ALTER COLUMN achievements SET DEFAULT '[]'::jsonb;
