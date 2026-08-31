-- SPEC DB 01 — Tabla daycares (specs/db/01-daycares-table.md)
-- Applied to remote project dkwzoobnaaxxpovxxgvt via Supabase MCP on 2026-08-31.
-- Final state includes the `SET search_path` hardening flagged by security advisors.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE daycares (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_daycares_updated_at
  BEFORE UPDATE ON daycares
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

CREATE POLICY daycares_read
  ON daycares FOR SELECT TO authenticated
  USING (true);

INSERT INTO daycares (name) VALUES
  ('Guardería Sala Soles'),
  ('Guardería Arcoíris'),
  ('Guardería Pequeños Pasos'),
  ('Guardería Estrellitas');
