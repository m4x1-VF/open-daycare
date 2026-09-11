# SPEC 12 — Registro de padre a través de código de invitación

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 08, SPEC 11
> **Fecha:** 2026-09-12
> **Objetivo:** Implementar el flujo completo de activación de cuenta para un padre invitado: leer el código de la URL, mostrar los datos reales del niño, validar el código, crear el usuario en Supabase Auth, vincularlo con el niño en `parent_children` y autenticarlo automáticamente.

## Por qué existe esta spec

SPEC 03 dejó `/activar-cuenta` como UI estática con datos hardcodeados ("Mateo · Sala Soles", código `7K4P9`, email `lucia.fernandez@gmail.com`). SPEC 11 completó el envío del email pero excluyó explícitamente el flujo de aceptación. Como consecuencia, cualquier padre que hace click en el link del email ve datos ficticios que no coinciden con su invitación real — ese es el bug que motiva esta spec.

## Scope

**In:**

- Tabla `parent_children` en Postgres según el schema de referencia (`id`, `parent_id`, `child_id`, `relationship`, `created_at`, UNIQUE(`parent_id`, `child_id`)) más columna `photo_consent` boolean not null default `false` (desviación del schema de referencia; ver decisiones).
- RLS en `parent_children`: SELECT filtrado por daycare del usuario autenticado (vía child → room → daycare). INSERT restringido a autenticados cuyo `users.id` coincida con `parent_id` (un padre solo puede vincularse a sí mismo).
- Función `get_invitation_preview(code)` SECURITY DEFINER, callable por `anon`, que devuelve `{ status, code, full_name, email, child_name, room_name, avatar_initial, daycare_id }` a partir de un JOIN entre `invitations`, `children`, `rooms`. Si el código no existe devuelve `null`.
- Server Component async `app/(auth)/activar-cuenta/page.tsx` que lee `searchParams.code`, invoca `get_invitation_preview` y pasa los datos reales al form como props. Manejo de estados: código inexistente, expirado, ya aceptado o cancelado renderiza un mensaje inline + link a `/login`.
- Conversión de `ActivateAccountForm` a Client Component (`"use client"`) con props reales: `code` (readonly), `fullName` (readonly), `email` (readonly), `childName`, `roomName`, `avatarInitial`, `status`. Inputs controlados por estado: `password`, `photoConsent`. Validación inline: password no vacía, consentimiento marcado. Mensaje de error inline del Server Action (incluyendo el caso "Ya tenés cuenta").
- Server Action `acceptInvitation(code, password, photoConsent)` en `app/(auth)/activar-cuenta/actions.ts` que: (1) vuelve a leer la invitación por código desde el servidor (con cliente autenticado-anon vía service role o helper dedicado), (2) valida `status = 'pending'` y `expires_at > now()`, (3) hace `supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'parent', daycare_id, status: 'active' } } })`, (4) si signUp falla por email duplicado → retorna `{ error: "already_registered" }` sin tocar la invitación, (5) si signUp OK → marca `invitations.status = 'accepted'` y `accepted_at = now()`, (6) inserta fila en `parent_children` con `parent_id = nuevoUsuario.id`, `child_id`, `relationship`, `photo_consent`, (7) hace `signInWithPassword({ email, password })` para auto-login, (8) `redirect("/")`.
- Tipo `InvitationPreview` en `app/_lib/invite-helpers.ts` (o `app/_lib/db-types.ts`) con la forma que devuelve la función SECURITY DEFINER.

**Out of scope (para specs futuras):**

- Login de un padre ya registrado que llega a `/activar-cuenta` con un código nuevo (la spec solo maneja el caso "Ya tenés cuenta" mostrando un mensaje; no vincula el niño a la cuenta existente).
- Reenvío de invitación si el código expiró.
- Cancelación de invitación desde la UI del staff.
- Expiración real del código mediante `pg_cron` o trigger (la validación se hace al momento de aceptar; no hay job que marque `expired`).
- Feed familia post-login (SPEC 08 rutea a `/` — cuando exista feed-familia se ajusta el redirect en otra spec).
- Verificación de email de Supabase Auth (se asume `email_confirmed_at` automático al usar `signUp` con este flujo).
- Multi-niño por padre: si un mismo email recibe invitaciones para dos niños distintos, esta spec solo maneja la primera aceptación. El resto requiere lógica adicional.
- Validación de robustez de contraseña (mínimo de caracteres, complejidad). La validación default de Supabase Auth aplica.
- Captura de `full_name` editable por el padre (se usa el que cargó el staff en la invitación).
- OAuth, recuperación de contraseña, dark mode.

## Data model

### SQL

```sql
CREATE TABLE parent_children (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      uuid               NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id       uuid               NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship   relationship_type  NOT NULL,
  photo_consent  boolean            NOT NULL DEFAULT false,
  created_at     timestamptz        NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_children_read
  ON parent_children FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.rooms r ON c.room_id = r.id
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY parent_children_insert_self
  ON parent_children FOR INSERT TO authenticated
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_code text)
RETURNS TABLE (
  status          invitation_status,
  code            text,
  full_name       text,
  email           text,
  child_name      text,
  room_name       text,
  avatar_initial  text,
  daycare_id      uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.status,
    i.code,
    i.full_name,
    i.email,
    c.full_name AS child_name,
    r.name       AS room_name,
    UPPER(LEFT(i.full_name, 1)) AS avatar_initial,
    r.daycare_id
  FROM public.invitations i
  JOIN public.children c   ON c.id = i.child_id
  JOIN public.rooms    r   ON r.id = c.room_id
  WHERE i.code = p_code
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
```

### TypeScript — tipo de preview

En `app/_lib/invite-helpers.ts`:

```ts
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface InvitationPreview {
  status: InvitationStatus;
  code: string;
  full_name: string;
  email: string;
  child_name: string;
  room_name: string;
  avatar_initial: string;
  daycare_id: string;
}
```

## Plan de implementación

1. **Migración SQL `activate_account_flow`:** crear `supabase/migrations/YYYYMMDDHHMMSS_activate_account_flow.sql` con el contenido del bloque SQL de arriba (tabla `parent_children`, RLS, políticas, función `get_invitation_preview` SECURITY DEFINER, grants). Aplicar vía MCP (`supabase_apply_migration`).

2. **Verificar migración:** `supabase_execute_sql` — invocar `SELECT * FROM public.get_invitation_preview('ADNVE')` como anon y verificar que devuelve los datos reales de la invitación existente (o `null` si no hay). Verificar también que `parent_children` existe con la columna `photo_consent`.

3. **Tipo `InvitationPreview`:** agregar a `app/_lib/invite-helpers.ts` la interfaz del Data Model (junto a `generateInviteCode` y `ROLE_LABELS` ya existentes).

4. **Server Action `acceptInvitation`:** crear `app/(auth)/activar-cuenta/actions.ts` con `'use server'`. Firma: `acceptInvitation(code: string, password: string, photoConsent: boolean): Promise<{ error?: string }>`. Flujo:
   - Usar cliente Supabase con service role (helper `createServiceClient()` o `process.env.SUPABASE_SERVICE_ROLE_KEY`) para leer la invitación por código sin depender de RLS de usuario.
   - Validar existencia, `status === 'pending'`, `expires_at > new Date()`. Si no: retornar `{ error: "invalid_or_expired" }`.
   - `supabase.auth.signUp({ email: invitation.email, password, options: { data: { full_name: invitation.full_name, role: 'parent', daycare_id: child_daycare_id, status: 'active' } } })`.
   - Si error `User already registered` (o equivalente de Supabase): retornar `{ error: "already_registered" }`.
   - Si OK: update `invitations` → `status: 'accepted'`, `accepted_at: now()`.
   - Insert en `parent_children` → `{ parent_id: newUser.id, child_id: invitation.child_id, relationship: invitation.relationship, photo_consent: photoConsent }`.
   - `signInWithPassword({ email: invitation.email, password })`.
   - `revalidatePath("/", "layout")` + `redirect("/")`.

5. **Helper `createServiceClient`:** si no existe, crear `utils/supabase/service.ts` que devuelva un cliente Supabase con `SUPABASE_SERVICE_ROLE_KEY` (env var server-side). Documentar en `.env.template` la nueva variable. Agregar valor real a `.env`.

6. **Server Component de página:** reescribir `app/(auth)/activar-cuenta/page.tsx` como async. Extraer `searchParams.code`, invocar `get_invitation_preview(code)` vía cliente Supabase (la función es callable por anon). Pasarle el preview al form. Si preview es `null` → renderizar bloque "Invitación no válida". Si `status !== 'pending'` → renderizar bloque correspondiente ("Código expirado", "Invitación ya aceptada" o "Invitación cancelada"), todos con link a `/login`.

7. **Conversión de `ActivateAccountForm` a Client Component:** agregar `"use client"`. Props: `preview: InvitationPreview`. Estado local: `password`, `photoConsent`, `error`, `isSubmitting`. Renderiza los mismos campos visuales del mockup pero con datos reales:
   - Card de invitación: avatar con `preview.avatar_initial`, texto "Te invitaron a seguir a `{preview.child_name} · Sala {preview.room_name}`".
   - Input CÓDIGO DE INVITACIÓN: `value={preview.code}`, `readOnly`.
   - Input EMAIL: `value={preview.email}`, `readOnly`.
   - Input CREAR CONTRASEÑA: controlado, `type="password"`.
   - Checkbox de consentimiento: controlado.
   - Botón "Activar mi cuenta": disabled mientras `!password || !photoConsent || isSubmitting`.
   - Si el Server Action retorna `{ error: "already_registered" }`: mensaje inline "Ya tenés una cuenta en OpenDayCare" + `<Link href="/login">Iniciar sesión</Link>`.
   - Si el Server Action retorna otro error: mensaje inline genérico ("No pudimos activar tu cuenta. Intentá de nuevo.").

8. **Verificación final:** `npm run lint` y `npx tsc --noEmit` pasan. `npm run dev`: abrir un perfil de niño, vincular un padre con un email real (que no esté registrado), recibir el email, hacer click en el link. La pantalla `/activar-cuenta?code=<código>` muestra el nombre real del niño y la sala, el email real del padre, y el código real. Completar contraseña + consent, presionar "Activar mi cuenta": se crea la fila en `users` (vía trigger), se marca la invitación como `accepted`, se crea la fila en `parent_children` con `photo_consent` según checkbox, el usuario queda autenticado y redirige a `/`.

## Acceptance criteria

- [x] La migración `activate_account_flow` se aplicó sin errores en Supabase.
- [x] La tabla `parent_children` existe con las columnas del schema de referencia + `photo_consent`.
- [x] La constraint UNIQUE (`parent_id`, `child_id`) existe en `parent_children`.
- [x] RLS habilitado en `parent_children`.
- [x] La política `parent_children_read` filtra por daycare del usuario autenticado.
- [x] La política `parent_children_insert_self` permite INSERT solo si `parent_id = auth.uid()`.
- [x] La función `get_invitation_preview(text)` existe y es SECURITY DEFINER.
- [x] `get_invitation_preview` es callable por el rol `anon`.
- [x] `get_invitation_preview` devuelve `child_name`, `room_name`, `avatar_initial`, `email`, `full_name`, `status`, `daycare_id` para un código válido.
- [x] `get_invitation_preview` devuelve `null` para un código inexistente.
- [x] `SUPABASE_SERVICE_ROLE_KEY` está documentada en `.env.template` y configurada en `.env`.
- [x] El helper `createServiceClient` existe en `utils/supabase/service.ts`.
- [x] El Server Action `acceptInvitation` existe en `app/(auth)/activar-cuenta/actions.ts` con `'use server'`.
- [x] Abrir `/activar-cuenta` sin query `code` muestra el estado "Invitación no válida" con link a `/login`.
- [x] Abrir `/activar-cuenta?code=<código-inexistente>` muestra el estado "Invitación no válida" con link a `/login`.
- [x] Abrir `/activar-cuenta?code=<código-expirado>` muestra el estado "Código expirado" con link a `/login`.
- [x] Abrir `/activar-cuenta?code=<código-aceptado>` muestra el estado "Invitación ya aceptada" con link a `/login`.
- [x] Abrir `/activar-cuenta?code=<código-pending-válido>` muestra el nombre real del niño, la sala real y el email real del padre (no los datos hardcodeados del mockup).
- [x] El input CÓDIGO DE INVITACIÓN es de solo lectura y muestra el código real de la invitación.
- [x] El input EMAIL es de solo lectura y muestra el email real del padre invitado.
- [x] El input CREAR CONTRASEÑA es controlado por estado y editable.
- [x] El checkbox de consentimiento de fotos es controlado por estado.
- [x] El botón "Activar mi cuenta" permanece deshabilitado mientras `password` esté vacío o el consentimiento no esté marcado.
- [x] Al enviar con datos válidos, se crea una fila en `auth.users` con email y contraseña del padre.
- [x] El trigger `handle_new_user()` crea automáticamente la fila en `public.users` con `role = 'parent'` y `daycare_id` del niño.
- [x] La fila de `invitations` queda con `status = 'accepted'` y `accepted_at` seteado.
- [x] Se crea una fila en `parent_children` con `parent_id`, `child_id`, `relationship` y `photo_consent` según el checkbox.
- [x] Después de crear la cuenta, el usuario queda autenticado (auto-login) y es redirigido a `/`.
- [x] Si el email de la invitación ya estaba registrado, el form muestra "Ya tenés una cuenta en OpenDayCare" con link a `/login` y no modifica la invitación.
- [x] `ActivateAccountForm` es ahora un Client Component (`"use client"`).
- [x] La página `/activar-cuenta` es un Server Component async.
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [x] `npm run dev` no registra errores en consola.

## Decisiones

- **Sí:** Tabla `parent_children` completa según schema de referencia, con `photo_consent` añadido.
  - **Por qué:** El flujo de aceptación es el momento natural para crear el vínculo padre ↔ niño. Sin la tabla, el padre tendría cuenta pero no estaría vinculado al niño — la feature quedaría rota.

- **Sí:** `photo_consent` en `parent_children` (no en `children` como sugiere el schema de referencia).
  - **Por qué:** El consentimiento lo da cada padre individualmente al activar su cuenta. Un niño puede tener dos padres y cada uno decide de forma independiente. Ponerlo en `children` sería una decisión global que no refleja la realidad legal. El schema de referencia es un borrador; esta es una corrección intencional.

- **Sí:** Función `get_invitation_preview` SECURITY DEFINER callable por `anon`.
  - **Por qué:** La página `/activar-cuenta` se carga sin sesión (el padre todavía no tiene cuenta). RLS bloquearía cualquier SELECT sin autenticación. La función devuelve solo los datos necesarios para el form y está limitada a una fila por código — no permite enumerar invitaciones.

- **Sí:** Exponer `email` en la preview.
  - **Por qué:** Quien tiene el código recibió el email en esa dirección. Mostrar el email no es un leak — es una confirmación para el padre de que está activando la cuenta correcta.

- **Sí:** Service role key en el Server Action para leer la invitación y actualizarla.
  - **Por qué:** El Server Action corre en un contexto sin sesión (el padre no está autenticado todavía). Necesita permisos elevados para leer `invitations` (RLS lo bloquea para anon) y actualizar `status`/`accepted_at`. La service role key vive solo del lado del servidor.

- **Sí:** Auto-login + redirect a `/` tras crear la cuenta.
  - **Por qué:** Menos fricción. El padre acaba de crear su contraseña; pedirle que la reingrese es un paso innecesario. Supabase Auth hace `signInWithPassword` inmediatamente después del `signUp` exitoso sin round-trip adicional.

- **Sí:** Email ya registrado retorna error inline y no modifica la invitación.
  - **Por qué:** Si el padre ya tiene cuenta, no podemos crear otra. El mensaje "Ya tenés una cuenta" + link a `/login` es suficiente para esta spec. El flujo de vincular el niño a una cuenta existente queda para otra spec (requiere lógica de login + aceptación diferida).

- **Sí:** Un solo input de contraseña (sin "Confirmar contraseña").
  - **Por qué:** Consistente con el mockup de SPEC 03. La validación default de Supabase Auth aplica (mínimo 6 caracteres). Agregar un segundo input es mejora de UX para iteración futura.

- **Sí:** `ActivateAccountForm` pasa de Server Component a Client Component.
  - **Por qué:** Ahora necesita estado (password, consentimiento, error, isSubmitting) y un form handler. No se puede hacer con Server Components puros.

- **Sí:** Página `/activar-cuenta` como Server Component async.
  - **Por qué:** La preview se obtiene una sola vez al cargar (no es interactiva). El Server Component hace el fetch y pasa props al Client Component. Menos JavaScript al cliente, el form solo se hidrata donde hay interactividad.

- **No:** Capturar `full_name` editable en el form de activación.
  - **Por qué:** El nombre ya lo cargó el staff al crear la invitación. Pedirlo otra vez es redundante. Si el padre necesita corregirlo, lo hace desde su perfil en otra spec.

- **No:** Manejar el caso de un email con múltiples invitaciones (multi-niño).
  - **Por qué:** Complejidad desproporcionada. La primera invitación aceptada crea la cuenta y el vínculo; las siguientes requieren un flujo de "ya estoy logueado, agregar otro niño" que no existe. Va en su propia spec si se necesita.

- **No:** Expiración real del código vía `pg_cron`.
  - **Por qué:** La validación al momento de aceptar (`expires_at > now()`) es suficiente para el MVP. El job de limpieza que marca `expired` las invitaciones viejas es una mejora operativa que va en otra spec.

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| La service role key queda expuesta al cliente | La key solo se usa en Server Actions (`'use server'`). Nunca se importa desde Client Components. Se documenta en `.env` y `.env.template` como variable server-side. No se publica en `NEXT_PUBLIC_*`. |
| `get_invitation_preview` permite enumerar códigos | La función acepta un código exacto y devuelve una sola fila. No hay API para listar. Los códigos son 5 caracteres alfanuméricos (1.6M combinaciones), y el rate limiting de Supabase Auth aplica sobre el `signUp` posterior. Aceptable para MVP; se puede añadir rate limiting en la función si se abusa. |
| `signInWithPassword` falla después del `signUp` exitoso | El usuario ya está creado en `auth.users` y la invitación ya está marcada `accepted`. Si el signIn falla, retornamos error inline "Cuenta creada pero no pudimos iniciar sesión. Intentá iniciar sesión desde /login" y dejamos que el usuario use el flujo normal de login. |
| El trigger `handle_new_user` lee metadata faltante | El Server Action siempre pasa `full_name`, `role`, `daycare_id`, `status`. Si por error falta alguno, el trigger falla con error de constraint y el signUp no completa — comportamiento intencional, no hay usuarios huérfanos. |

## Qué **no** está en esta spec

- Login de un padre ya registrado que llega a `/activar-cuenta` con un código nuevo (solo mostramos mensaje).
- Reenvío de invitación por email.
- Cancelación de invitación desde la UI del staff.
- Expiración real del código vía `pg_cron`.
- Feed familia post-login (redirect actual a `/`).
- Verificación de email por Supabase Auth.
- Multi-niño por padre (un email, dos invitaciones).
- Validación de robustez de contraseña más allá del default de Supabase.
- Edición del `full_name` por el padre durante la activación.
- OAuth, recuperación de contraseña, dark mode.

Cada una de esas, si se implementa, va en su propia spec.
