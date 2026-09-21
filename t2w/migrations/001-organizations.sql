-- Run once on a NEW database. No existing tables or JSON files are altered.
CREATE SCHEMA IF NOT EXISTS time2work_private;
REVOKE ALL ON SCHEMA time2work_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS time2work_private.organizations (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (document->'org'->>'id' = id::text),
  CHECK (document->'org'->>'code' = code)
);
ALTER TABLE time2work_private.organizations ENABLE ROW LEVEL SECURITY;
-- No browser policies: access only through the authenticated Next.js API.
-- Use the database owner connection in server-only DATABASE_URL.
REVOKE ALL ON time2work_private.organizations FROM PUBLIC;
