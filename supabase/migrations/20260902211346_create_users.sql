-- SPEC DB 02 — Tabla users (specs/db/02-users-table.md)
-- Applied to remote project dkwzoobnaaxxpovxxgvt via Supabase MCP on 2026-09-02.
-- Enums, tabla users vinculada a auth.users, trigger updated_at,
-- RLS con funcion SECURITY DEFINER (evita recursion infinita de RLS) y seed staff.

CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

CREATE TABLE users (
  id                      uuid        PRIMARY KEY,
  daycare_id              uuid        REFERENCES daycares(id),
  role                    user_role   NOT NULL,
  status                  user_status NOT NULL DEFAULT 'active',
  full_name               text        NOT NULL,
  avatar_url              text,
  notify_on_post          boolean     NOT NULL DEFAULT true,
  daily_summary_enabled   boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_auth_users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- SECURITY DEFINER: la politica users_read no puede hacer subquery sobre la
-- misma tabla users (infinite recursion detected in policy). La funcion corre
-- como su dueno y bypasea RLS internamente, cortando la recursion.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.get_user_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT daycare_id FROM public.users WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION private.get_user_daycare_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_user_daycare_id() TO authenticated;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_read
  ON users FOR SELECT TO authenticated
  USING (
    daycare_id = (select private.get_user_daycare_id())
  );

-- Seed: 1 usuario staff de prueba. Password hardcodeada solo para pruebas
-- (ver Risks en la spec): rotar o borrar antes de produccion.
--
-- auth.users NO tiene defaults en la mayoria de sus columnas: para que el
-- login funcione (GoTrue v2.196) la fila requiere instance_id = uuid.Nil,
-- aud/role = 'authenticated', los tokens como '' (NO NULL: el ORM de GoTrue
-- falla al escanear NULL en campos string) y su fila en auth.identities.
-- Verificado en SPEC 08 (verificacion final). El daycare_id del metadata
-- debe existir en daycares porque el trigger on_auth_user_created lo usa.
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_current, email_change_token_new, email_change,
  phone_change_token, phone_change, reauthentication_token,
  email_change_confirm_status,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'maxi@google.com',
  extensions.crypt('Abc123456@', extensions.gen_salt('bf')),
  now(),
  '', '', '', '', '',
  '', '', '',
  0,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'full_name', 'Maxi',
    'role', 'staff',
    'daycare_id', (SELECT id FROM daycares WHERE name = 'Guardería Sala Soles')
  ),
  now(),
  now()
);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'maxi@google.com',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'maxi@google.com',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
);

INSERT INTO users (id, daycare_id, role, status, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM daycares WHERE name = 'Guardería Sala Soles'),
  'staff',
  'active',
  'Maxi'
);
