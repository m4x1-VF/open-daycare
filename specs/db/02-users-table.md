# SPEC DB 02 — Tabla users

> **Estado:** Implementado
> **Depende de:** SPEC DB 01
> **Fecha:** 2026-09-02
> **Objetivo:** Crear la tabla `users` en Supabase vinculada a `auth.users`, con enums `user_role` y `user_status`, RLS activado que permite lectura de todos los usuarios del mismo daycare, y un usuario de prueba staff.

## Scope

**In:**

- Migración SQL aplicada directo al proyecto remoto vía MCP (`supabase_apply_migration`). Sin CLI local ni `supabase init`.
- Enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`).
- Tabla `users` con columnas: `id uuid PK` (FK → `auth.users(id)` ON DELETE CASCADE), `daycare_id uuid FK → daycares`, `role user_role`, `status user_status` (default `active`), `full_name text`, `avatar_url text` (nullable), `notify_on_post boolean` (default `true`), `daily_summary_enabled boolean` (default `true`), `created_at timestamptz`, `updated_at timestamptz`.
- Trigger `set_users_updated_at` en `users` que invoca `set_updated_at()` (función de SPEC DB 01) en `BEFORE UPDATE`.
- RLS habilitado en `users` con políticas:
  - `users_read`: usuarios autenticados pueden leer todos los usuarios del mismo daycare (`SELECT` con `USING (daycare_id = (select private.get_user_daycare_id())) TO authenticated`).
  - Función `private.get_user_daycare_id()` (`SECURITY DEFINER`, schema `private` no expuesto) que devuelve el `daycare_id` del llamador — evita la recursión infinita de políticas RLS que consultan su propia tabla.
  - Sin políticas de `INSERT`, `UPDATE` ni `DELETE` todavía.
- Seed de 1 usuario staff: email `maxi@google.com`, password `Abc123456@`, full_name `Maxi`, role `staff`, daycare `Guardería Sala Soles`.

**Out of scope (para specs futuras):**

- Trigger automático en `auth.users` para crear fila en `users` (se implementa en la spec de registro/auth).
- Políticas de escritura en `users` (INSERT/UPDATE/DELETE).
- Funciones RPC o Edge Functions para gestionar usuarios.
- UI para crear, editar o listar usuarios.
- Validación de email único (Supabase Auth lo gestiona en `auth.users`).
- Usuarios parent o admin en el seed.
- Migraciones locales con Supabase CLI.

## Data model

```sql
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

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'maxi@google.com',
  extensions.crypt('Abc123456@', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Maxi", "role": "staff", "daycare_id": "00000000-0000-0000-0000-000000000001"}'::jsonb
);

INSERT INTO users (id, daycare_id, role, status, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM daycares WHERE name = 'Guardería Sala Soles'),
  'staff',
  'active',
  'Maxi'
);
```

## Implementation plan

1. **Aplicar migración `create_users`** vía `supabase_apply_migration` — contiene en orden: (a) enums `user_role` y `user_status`, (b) tabla `users` con FK a `daycares` y `auth.users`, (c) trigger `set_users_updated_at`, (d) RLS + política `users_read`, (e) seed en `auth.users` + `users`.
2. **Verificar esquema** con `supabase_list_tables` (verbose) — confirmar columnas y tipos de `users`.
3. **Verificar enums** con `supabase_execute_sql` — `SELECT enum_range(NULL::user_role)` y `SELECT enum_range(NULL::user_status)`.
4. **Verificar RLS** con `supabase_get_advisors` (security) — sin warnings de RLS faltante para `users`.
5. **Verificar usuario seed** con `supabase_execute_sql` — `SELECT u.*, d.name AS daycare_name FROM users u JOIN daycares d ON u.daycare_id = d.id WHERE u.id = '00000000-0000-0000-0000-000000000001'` devuelve 1 fila con `full_name = 'Maxi'`, `role = 'staff'`, `daycare_name = 'Guardería Sala Soles'`.
6. **Verificar trigger** con `supabase_execute_sql` — `UPDATE users SET full_name = full_name WHERE id = '00000000-0000-0000-0000-000000000001'` y verificar que `updated_at` cambió.

## Acceptance criteria

- [x] La migración `create_users` se aplicó sin errores en Supabase.
- [x] Los enums `user_role` y `user_status` existen con los valores correctos.
- [x] La tabla `users` existe con las 10 columnas correctas (`id` uuid PK, `daycare_id` uuid FK, `role` user_role, `status` user_status, `full_name` text, `avatar_url` text, `notify_on_post` boolean, `daily_summary_enabled` boolean, `created_at` timestamptz, `updated_at` timestamptz).
- [x] La columna `id` tiene FK a `auth.users(id)` con `ON DELETE CASCADE`.
- [x] La columna `daycare_id` tiene FK a `daycares(id)`.
- [x] El trigger `set_users_updated_at` está asociado a `users` en `BEFORE UPDATE`.
- [x] Hacer `UPDATE` en una fila actualiza automáticamente `updated_at`.
- [x] RLS está habilitado en `users`.
- [x] Existe la política `users_read` que permite `SELECT` a usuarios autenticados del mismo daycare.
- [x] La tabla contiene 1 fila: `full_name = 'Maxi'`, `role = 'staff'`, `status = 'active'`, `daycare_id` apunta a "Guardería Sala Soles".
- [x] El usuario existe en `auth.users` con email `maxi@google.com` y password hasheada.
- [x] `supabase_get_advisors` (security) no reporta warnings de RLS faltante para `users`.

## Decisions

- **Sí:** FK a `auth.users(id)` con `ON DELETE CASCADE` — mantiene integridad referencial con Supabase Auth; si se borra el usuario de auth, se borra su fila de dominio.
- **Sí:** `daycare_id` FK a `daycares` — vincula cada usuario a una guardería desde el inicio. Consistente con el modelo relacional.
- **Sí:** Enums `user_role` y `user_status` — tipado fuerte en Postgres, evita strings mágicos y permite validación a nivel DB.
- **Sí:** RLS con lectura filtrada por daycare — cada usuario solo ve a sus compañeros del mismo daycare. Seguridad desde el día uno.
- **Sí:** Función `private.get_user_daycare_id()` (`SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, schema `private` no expuesto por la API) que devuelve el `daycare_id` del llamador — reemplaza el subquery directo sobre `users` en la política, que causaba `infinite recursion detected in policy` (docs de Supabase: "a policy queries the same table"). `EXECUTE` revocado de `PUBLIC` y otorgado a `authenticated`. Decisión aprobada por el usuario (opción B).
- **Sí:** Cualificar `extensions.crypt()` / `extensions.gen_salt()` en el seed — pgcrypto está instalado en el schema `extensions` y el search_path del runner de migraciones no lo garantiza.
- **Sí:** Sin políticas de escritura todavía — se implementan en la spec de registro/auth cuando exista el flujo completo.
- **Sí:** Seed manual en `auth.users` + `users` — permite probar consultas desde el inicio sin depender de un trigger automático.
- **Sí:** Solo 1 usuario staff en el seed — suficiente para probar consultas y políticas RLS.
- **No:** Trigger automático en `auth.users` — fuera de scope; se implementa en la spec de registro/auth junto con el flujo de signup.
- **No:** Usuarios parent o admin en el seed — se agregan cuando se implementen los flujos correspondientes.
- **No:** Políticas de escritura — requieren contexto de roles y permisos que se define en la spec de auth.
- **No:** Columna `email` en `users` — Supabase Auth ya la gestiona en `auth.users`; duplicarla crea inconsistencia.
- **No:** Índices adicionales — la tabla tendrá pocas filas inicialmente; el PK y las FKs bastan.

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| FK a `auth.users` requiere que el usuario exista en auth antes de insertar en `users` | El seed inserta en `auth.users` primero, luego en `users`. Orden correcto en la migración. |
| Política RLS que consulta su propia tabla causa `infinite recursion detected in policy` | Mitigado con `private.get_user_daycare_id()` `SECURITY DEFINER` (patrón documentado por Supabase): el subquery dentro de la función corre sin RLS. |
| Password hardcodeada en el seed | Solo para pruebas; se rota o borra antes de producción. No se expone en logs ni UI. |
| Migración al remoto sin rollback local | Si falla, se aplica un `DROP TABLE users` + `DROP TYPE` correctivo. Las filas de seed son descartables. |

## What is **not** in this spec

- Trigger automático en `auth.users` para crear fila en `users`.
- Políticas de escritura en `users` (INSERT/UPDATE/DELETE).
- Funciones RPC o Edge Functions para gestionar usuarios.
- UI para crear, editar o listar usuarios.
- Validación de email único en `users` (Supabase Auth lo gestiona).
- Usuarios parent o admin en el seed.
- Migraciones locales con Supabase CLI.

Cada una de esas, si se implementa, va en su propia spec.
