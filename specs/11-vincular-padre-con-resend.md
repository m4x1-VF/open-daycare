# SPEC 11 — Vincular padre con email real (Resend)

> **Estado:** Implementado
> **Depende de:** SPEC 06, SPEC 10
> **Fecha:** 2026-09-11
> **Objetivo:** Persistir las invitaciones de vinculación en la tabla `invitations` y enviar el email al padre vía Resend desde un Server Action, mostrando en el perfil los padres PENDIENTE cargados desde la base de datos.

## Scope

**In:**

- Tabla `invitations` en Supabase con enum `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) y enum `relationship_type` (`mom`, `dad`, `guardian`), columnas según schema de referencia (`id`, `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code`, `status`, `expires_at`, `accepted_at`, `created_at`).
- RLS en `invitations`: SELECT filtrado por daycare del staff autenticado (vía child → room → daycare). INSERT con check de tenencia del child.
- Server Action `sendInvitation` que inserta en `invitations`, envía el email con Resend, y devuelve la fila creada.
- Package `resend` instalado en el proyecto.
- Envío del email desde Next.js (Server Action) con template HTML simple: nombre del padre, nombre del niño, código de invitación, link a `${NEXT_PUBLIC_APP_URL}/activar-cuenta?code=${code}`.
- Actualizar `LinkParentModal` para que `onSave` sea asíncrono, muestre estado `isSending` (botón disabled con spinner) y estado `success` (mensaje "Invitación enviada a {email}") antes de cerrar.
- Actualizar `ParentsSection` para cargar la lista de padres PENDIENTE desde la tabla `invitations` (status `pending`) al abrir el perfil, además de los ya vinculados activos.
- Agregar `NEXT_PUBLIC_APP_URL` a `.env.template` si no existe.

**Out of scope (para specs futuras):**

- Flujo de aceptación de invitación (página `/activar-cuenta`, validación del código, creación de cuenta de padre).
- Tabla `parent_children` y vinculación real padre ↔ niño (se crea cuando el padre acepta).
- Reenvío de invitación.
- Cancelación de invitación desde la UI.
- Expiración real del código (cron o trigger que marque `expired`).
- Retry de email fallido.
- Validación de que el email no esté ya registrado como usuario.
- Rate limiting de invitaciones.

## Data model

### SQL

```sql
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE relationship_type AS ENUM ('mom', 'dad', 'guardian');

CREATE TABLE invitations (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid              NOT NULL REFERENCES children(id),
  invited_by    uuid              NOT NULL REFERENCES auth.users(id),
  full_name     text              NOT NULL,
  email         text              NOT NULL,
  relationship  relationship_type NOT NULL,
  code          text              NOT NULL UNIQUE,
  status        invitation_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz       NOT NULL,
  accepted_at   timestamptz,
  created_at    timestamptz       NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_read
  ON invitations FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY invitations_insert
  ON invitations FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );
```

### TypeScript — tipos DB

En `app/_lib/db-types.ts`:

```ts
export interface DbInvitation {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: "mom" | "dad" | "guardian";
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
```

### Server Action — `sendInvitation`

```ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { generateInviteCode, ROLE_LABELS } from "@/app/_lib/invite-helpers";

interface SendInvitationInput {
  child_id: string;
  child_name: string;
  full_name: string;
  email: string;
  relationship: "mom" | "dad" | "guardian";
}

export async function sendInvitation(input: SendInvitationInput) {
  const supabase = await createClient();
  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      child_id: input.child_id,
      full_name: input.full_name,
      email: input.email.trim().toLowerCase(),
      relationship: input.relationship,
      code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const roleLabel = ROLE_LABELS[input.relationship];

  await resend.emails.send({
    from: "OpenDayCare <onboarding@resend.dev>",
    to: input.email,
    subject: "Activá tu cuenta en OpenDayCare",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <h2>¡Hola ${input.full_name}!</h2>
        <p>Fuiste vinculado como <strong>${roleLabel}</strong> de <strong>${input.child_name}</strong>.</p>
        <p>Tu código de invitación es:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;background:#FBF1D6;padding:20px;border-radius:12px;margin:16px 0">
          ${code}
        </div>
        <p style="text-align:center">
          <a href="${appUrl}/activar-cuenta?code=${code}"
             style="display:inline-block;background:#EE8164;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold">
            Activar mi cuenta
          </a>
        </p>
        <p style="font-size:13px;color:#888">Este código vence en 7 días.</p>
      </div>
    `,
  });

  return data;
}
```

## Implementation plan

1. **Instalar Resend:** `npm install resend`.

2. **Migración `create_invitations`:** crear y aplicar vía MCP — enum `invitation_status`, enum `relationship_type`, tabla `invitations`, RLS, políticas SELECT e INSERT. Escribir archivo en `supabase/migrations/YYYYMMDDHHMMSS_create_invitations.sql`.

3. **Tipo DB:** agregar `DbInvitation` a `app/_lib/db-types.ts`.

4. **Server Action:** crear o extender `app/(main)/ninos/actions.ts` con `sendInvitation(input)`. Incluye inserción en DB + envío por Resend.

5. **Actualizar `LinkParentModal`:** `onSave` cambia de `(parent: LinkedParent) => void` a `(data: { full_name, email, relationship, child_id }) => Promise<void>`. Agregar estado `isSending` y `successMessage`. Durante envío, botón disabled con spinner. Al éxito, mostrar mensaje "Invitación enviada a {email}" durante ~2 segundos y cerrar. Si falla, mostrar error inline. Eliminar la generación local del `LinkedParent` (eso ahora lo hace el server action + query).

6. **Actualizar `ParentsSection`:** recibe `childId: string` además de `child`. Al montar (y después de cada envío exitoso), hace fetch de invitations pendientes para ese child: `supabase.from("invitations").select("*").eq("child_id", childId).eq("status", "pending")`. Mapea `DbInvitation` → `LinkedParent` (status `pending`, badge PENDIENTE) y los concatena a la lista local.

7. **Actualizar `app/ninos/[id]/page.tsx`:** pasar `childId` a `ParentsSection`.

8. **Agregar `NEXT_PUBLIC_APP_URL`** a `.env.template` si no existe (con valor placeholder `http://localhost:3000`).

9. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan. `npm run dev`: abrir perfil de un niño, click "Vincular otro padre", llenar form, presionar "Enviar invitación" — botón muestra spinner; al completar se muestra "Invitación enviada a {email}"; la modal se cierra; el nuevo padre aparece en la lista con badge PENDIENTE; la fila existe en Supabase con status `pending`. Refresh mantiene al padre PENDIENTE (viene de DB).

## Acceptance criteria

- [x] La migración `create_invitations` se aplicó sin errores en Supabase.
- [x] El enum `invitation_status` existe con valores `pending`, `accepted`, `expired`, `cancelled`.
- [x] El enum `relationship_type` existe con valores `mom`, `dad`, `guardian`.
- [x] La tabla `invitations` existe con las columnas del schema de referencia.
- [x] RLS habilitado en `invitations`.
- [x] `invitations_read` permite SELECT a usuarios autenticados del mismo daycare.
- [x] `invitations_insert` permite INSERT solo si el `child_id` pertenece al daycare del usuario.
- [x] El package `resend` está instalado en `package.json`.
- [x] El Server Action `sendInvitation` inserta en `invitations` y envía el email vía Resend.
- [x] El email HTML incluye nombre del padre, nombre del niño, código de invitación y link de activación.
- [x] El link de activación apunta a `${NEXT_PUBLIC_APP_URL}/activar-cuenta?code=${code}`.
- [x] El código de invitación vence en 7 días (`expires_at` = now + 7 días).
- [x] Al presionar "Enviar invitación", el botón muestra estado de carga (disabled + spinner).
- [x] Al envío exitoso, se muestra "Invitación enviada a {email}" durante ~2 segundos antes de cerrar la modal.
- [x] Si el envío falla, se muestra un error inline sin cerrar la modal.
- [x] Al abrir el perfil del niño, los padres PENDIENTE se cargan desde `invitations` (status `pending`).
- [x] Al refrescar la página, los padres PENDIENTE persisten (vienen de DB).
- [x] `LinkParentModal` no genera el `LinkedParent` localmente — el padre nuevo viene del query post-envío.
- [x] `ParentsSection` recibe `childId` por props.
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [x] `npm run dev` no registra errores en consola.

## Decisions

- **Sí:** Tabla `invitations` completa según schema de referencia, no una tabla simplificada.
  - **Por qué:** El schema ya define la estructura correcta. El flujo de aceptación (spec futura) necesita `accepted_at`, `expires_at`, y el enum `invitation_status` para funcionar sin migrations adicionales.

- **Sí:** Enum `relationship_type` compartido entre `invitations` y `parent_children` (spec futura).
  - **Por qué:** Ambas tablas modelan el mismo concepto (parentesco). Un solo enum mantiene consistencia.

- **Sí:** Envío del email dentro del Server Action, no en un Edge Function.
  - **Por qué:** El Server Action ya corre en el servidor con el cliente Supabase autenticado. Agregar un Edge Function sería over-engineering para un solo envío. Edge Functions tienen sentido para webhooks o jobs asíncronos.

- **Sí:** Template HTML inline en el Server Action.
  - **Por qué:** Un solo template de email no justifica un sistema de templates. Si crece, se extrae en otra spec.

- **Sí:** Mostrar padres PENDIENTE desde DB en el perfil.
  - **Por qué:** Crear una invitación sin reflejarla en la UI sería incompleto. El staff necesita ver qué invitaciones están activas.

- **Sí:** `LinkParentModal` deja de construir el `LinkedParent` localmente.
  - **Por qué:** Ahora la fuente de verdad es la DB. El componente solo envía datos del form; el padre nuevo llega del query post-envío. Esto elimina la divergencia entre UI y DB.

- **No:** Flujo de aceptación (`/activar-cuenta`).
  - **Por qué:** Involucra auth (signup de padre), página nueva, validación de código — complejidad suficiente para su propia spec.

- **No:** Tabla `parent_children` en esta spec.
  - **Por qué:** Se crea cuando el padre acepta la invitación (spec futura). La invitación pendiente vive en `invitations` hasta entonces.

- **No:** Expiración real del código (cron que marque `expired`).
  - **Por qué:** Requiere `pg_cron` o un job externo. Se agrega en la spec de aceptación cuando se necesite validar expiración.

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| Resend falla (API key inválida, rate limit, dominio no verificado) | El Server Action hace try/catch. Si Resend falla, la fila de invitación queda creada pero sin email. Se muestra error inline. El staff puede reintentar en otra spec. |
| `from` de Resend requiere dominio verificado | Resend permite `onboarding@resend.dev` para testing sin dominio propio. Para producción se necesita verificar dominio en otra spec. |
| `NEXT_PUBLIC_APP_URL` no configurada | Documentar en `.env.template`. Si falta, el link del email será `undefined/activar-cuenta` — el usuario lo nota rápido. |
| Doble invitación al mismo email | `code` es UNIQUE pero `email` no. Mismo padre puede recibir múltiples invitaciones. Aceptable para MVP — la dedup por email+child se agrega si molesta. |

## What is **not** in este spec

- Flujo de aceptación de invitación (página `/activar-cuenta`).
- Tabla `parent_children`.
- Reenvío de invitación.
- Cancelación de invitación desde la UI.
- Expiración real del código (cron).
- Retry de email fallido.
- Validación de que el email no esté registrado como usuario.
- Rate limiting de invitaciones.

Cada una de esas, si se implementa, va en su propia spec.
