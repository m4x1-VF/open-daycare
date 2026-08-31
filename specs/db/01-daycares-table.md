# SPEC DB 01 — Tabla daycares

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-08-31
> **Objetivo:** Crear la tabla `daycares` en Supabase como entidad raíz del modelo, con RLS activado, trigger de `updated_at`, función reutilizable `set_updated_at()`, y 4 filas de seed incluyendo "Guardería Sala Soles".

## Scope

**In:**

- Migración SQL aplicada directo al proyecto remoto vía MCP (`supabase_apply_migration`). Sin CLI local ni `supabase init`.
- Tabla `daycares` con columnas: `id uuid PK DEFAULT gen_random_uuid()`, `name text NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`.
- Función SQL `set_updated_at()` — genérica, `RETURNS TRIGGER`, asigna `NEW.updated_at = now()`. Se crea en esta migración porque es la primera tabla que la necesita y todas las tablas futuras con `updated_at` la reutilizan.
- Trigger `set_daycares_updated_at` en `daycares` que invoca `set_updated_at()` en `BEFORE UPDATE`.
- RLS habilitado en `daycares` con política `daycares_read`: usuarios autenticados pueden leer todas las filas (`SELECT` con `USING (true) TO authenticated`). Sin políticas de `INSERT`, `UPDATE` ni `DELETE` todavía.
- Seed de 4 guarderías: `"Guardería Sala Soles"`, `"Guardería Arcoíris"`, `"Guardería Pequeños Pasos"`, `"Guardería Estrellitas"`.

**Out of scope (para specs futuras):**

- Tabla `users` y cualquier otra tabla del esquema.
- Políticas de escritura en `daycares` (requieren `users` y roles).
- Índices adicionales (la tabla tiene pocas filas; el PK basta).
- Migraciones locales con Supabase CLI.
- Funciones RPC o Edge Functions para gestionar daycares.
- UI para crear o editar daycares.
- Soft delete o columna `status` en daycares.

## Data model

```sql
CREATE TABLE daycares (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
```

## Implementation plan

1. **Aplicar migración `create_daycares`** vía `supabase_apply_migration` — contiene en orden: (a) función `set_updated_at()`, (b) tabla `daycares`, (c) trigger, (d) RLS + política, (e) seed.
2. **Verificar esquema** con `supabase_list_tables` (verbose) — confirmar columnas y tipos.
3. **Verificar RLS** con `supabase_get_advisors` (security) — sin warnings de RLS faltante.
4. **Verificar datos** con `supabase_execute_sql` — `SELECT * FROM daycares ORDER BY created_at` devuelve 4 filas.
5. **Verificar trigger** con `supabase_execute_sql` — `UPDATE daycares SET name = name WHERE name = 'Guardería Sala Soles'` y verificar que `updated_at` cambió.

## Acceptance criteria

- [x] La migración `create_daycares` se aplicó sin errores en Supabase.
- [x] La tabla `daycares` existe con las 4 columnas correctas (`id` uuid PK, `name` text NOT NULL, `created_at` timestamptz, `updated_at` timestamptz).
- [x] La función `set_updated_at()` existe y es `LANGUAGE plpgsql`.
- [x] El trigger `set_daycares_updated_at` está asociado a `daycares` en `BEFORE UPDATE`.
- [x] Hacer `UPDATE` en una fila actualiza automáticamente `updated_at`.
- [x] RLS está habilitado en `daycares`.
- [x] Existe la política `daycares_read` que permite `SELECT` a usuarios autenticados.
- [x] La tabla contiene 4 filas: "Guardería Sala Soles", "Guardería Arcoíris", "Guardería Pequeños Pasos", "Guardería Estrellitas".
- [x] Todos los `id` son UUIDs válidos generados por `gen_random_uuid()`.
- [x] `supabase_get_advisors` (security) no reporta warnings de RLS faltante para `daycares`.

## Decisions

- **Sí:** `updated_at` además de `created_at` — consistencia con la convención del proyecto y todas las tablas futuras.
- **Sí:** Función `set_updated_at()` genérica — infraestructura reutilizable, se crea una vez y se usa en cada tabla futura.
- **Sí:** RLS con lectura para autenticados — base de seguridad desde el día uno; se refina cuando exista `users`.
- **Sí:** Seed en la misma migración — garantiza datos desde el inicio para specs futuras.
- **Sí:** Migración directo al remoto vía MCP — no hay CLI local configurado, suficiente para esta primera tabla.
- **No:** Políticas de escritura — sin `users` no hay contexto de roles ni tenencia.
- **No:** Columna `status` o soft delete — over-engineering para la entidad raíz.
- **No:** Índices adicionales — la tabla tendrá pocas filas, el PK basta.
- **No:** Migraciones locales con CLI — se configura si el workflow lo necesita después.

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| Migración al remoto sin rollback local | Si falla, se aplica un `DROP TABLE` correctivo. Las filas de seed son descartables. |
| Política RLS muy permisiva (`USING (true)`) | Se refina en la spec que crea `users`, filtrando por `daycare_id`. |
| Función `set_updated_at()` en schema `public` | Se mueve con `ALTER FUNCTION ... SET SCHEMA` si se separa en el futuro. |

## What is **not** in this spec

- Tabla `users` y cualquier otra tabla.
- Políticas de escritura en `daycares`.
- Índices adicionales.
- Migraciones locales con Supabase CLI.
- Funciones RPC o Edge Functions.
- UI para gestionar daycares.
- Soft delete o columna `status`.

Cada una de esas, si se implementa, va en su propia spec.
