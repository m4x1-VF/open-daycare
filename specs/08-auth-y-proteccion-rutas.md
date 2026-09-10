# SPEC 08 — Autenticación email/password y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC DB 02
> **Fecha:** 2026-09-10
> **Objetivo:** Conectar el formulario de login a Supabase Auth con email/password, implementar logout, crear el trigger automático en `auth.users` para la tabla `users`, y proteger todas las rutas excepto `/login` y `/activar-cuenta`.

## Scope

**In:**

- Server Action `signIn` en `app/(auth)/login/actions.ts` que llama `supabase.auth.signInWithPassword()` con email y password.
- Server Action `signOut` en la misma file que llama `supabase.auth.signOut()` y redirige a `/login`.
- Convertir `LoginForm` (`app/_components/auth/login-form.tsx`) de Server Component estático a Client Component con `useState`, validación inline (email no vacío, password no vacía), submit al Server Action y mensaje de error inline por credenciales inválidas.
- Convertir `app/(auth)/login/page.tsx` para cablear el form interactivo (pasa de renderizar un componente estático a uno con estado).
- Proteger rutas en `proxy.ts` (raíz): después de `getClaims()` en `updateSession()`, si no hay claims y la ruta no empieza con `/login` ni `/activar-cuenta`, redirect a `/login`.
- Trigger `on_auth_user_created` (`AFTER INSERT ON auth.users`) que invoca `handle_new_user()` para crear la fila en `public.users` usando `raw_user_meta_data` (`full_name`, `role`, `daycare_id`, `status`).
- Migración SQL `create_auth_trigger` en `supabase/migrations/` con la función y el trigger.
- Botón de logout: form con `action={signOut}` en la TopBar del layout autenticado (visible en todas las rutas protegidas).
- Post-login redirect a `/` (home feed staff de SPEC 01).
- Manejo de errores: credenciales inválidas muestra "Email o contraseña incorrectos" inline debajo del botón, sin redirect.

**Out of scope (para specs futuras):**

- Flujo de activar cuenta (validación de código de invitación + `signUp` en Supabase Auth).
- Recuperar contraseña / "¿Olvidaste tu contraseña?"
- Registro público sin invitación.
- Toggle Personal/Familia en el login.
- OAuth / proveedores sociales (Google, Apple, etc.).
- Feed diferenciado por rol (staff vs parent).
- Verificación de email con link de confirmación (Supabase Auth ya lo gestiona; esta spec asume usuarios con `email_confirmed_at` seteado).
- Rate limiting o bloqueo por intentos fallidos.
- Dark mode.

## Data model

Esta spec **no introduce nuevas estructuras de frontend**. La única adición es en la base de datos:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, status, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'daycare_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    COALESCE((NEW.raw_user_meta_data->>'status')::public.user_status, 'active'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

El trigger lee `raw_user_meta_data` que se pasa durante `signUp` (en specs futuras de activar cuenta). Para el login actual, el usuario seed de SPEC DB 02 (`maxi@google.com`) ya tiene su fila en `public.users` insertada manualmente, por lo que el trigger no afecta el flujo de esta spec.

## Implementation plan

1. **Migración SQL `create_auth_trigger`:** crear `supabase/migrations/YYYYMMDDHHMMSS_create_auth_trigger.sql` con la función `handle_new_user()` (`SECURITY DEFINER`, `SET search_path = ''`) y el trigger `on_auth_user_created` en `auth.users`. Aplicar vía `supabase_apply_migration`.

2. **Verificar migración:** `supabase_execute_sql` — insertar un usuario de prueba en `auth.users` con `raw_user_meta_data` y verificar que se creó la fila correspondiente en `public.users`. Borrar el usuario de prueba después.

3. **Server Actions:** crear `app/(auth)/login/actions.ts` con dos funciones `'use server'`:
   - `signIn(formData: FormData)` — extrae `email` y `password`, valida que no estén vacíos, llama `supabase.auth.signInWithPassword()`. Si hay error, retorna `{ error: "Email o contraseña incorrectos" }` sin redirect. Si es exitoso, `revalidatePath('/', 'layout')` + `redirect('/')`.
   - `signOut()` — llama `supabase.auth.signOut()` + `redirect('/login')`.

4. **Convertir `LoginForm`:** cambiar `app/_components/auth/login-form.tsx` de Server Component a Client Component (`"use client"`). Añadir estado local (`email`, `password`, `error`, `isLoading`). El `<form>` usa `action` del Server Action `signIn`. Validación inline: email y password obligatorios, botón deshabilitado mientras estén vacíos o `isLoading` es `true`. Error inline debajo del botón si el Server Action retorna error. Mantener toda la UI visual del mockup (tokens, layout, tipografía).

5. **Actualizar página login:** ajustar `app/(auth)/login/page.tsx` si es necesario para que renderice el `LoginForm` interactivo (probablemente sin cambios si el componente se auto-gestiona).

6. **Proteger rutas en proxy:** modificar `proxy.ts` (raíz) — después de invocar `updateSession()` que ya hace `getClaims()`, verificar si hay sesión. Si no hay claims y `request.nextUrl.pathname` no empieza con `/login` ni `/activar-cuenta`, construir redirect a `/login` y retornarlo. Alternativamente, agregar la lógica de redirect dentro de `updateSession()` en `utils/supabase/middleware.ts` para mantener la separación de responsabilidades.

7. **Botón logout en TopBar:** añadir un `<form action={signOut}>` con un `<button>` en el componente `TopBar` (o donde sea más visible en el layout autenticado). El botón muestra "Cerrar sesión" o un ícono de salida.

8. **Verificación final:** `npm run lint` y `npx tsc --noEmit` pasan. `npm run dev`: sin sesión, acceder a `/` redirige a `/login`. Login con `maxi@google.com` / `Abc123456@` redirige a `/`. Login con credenciales incorrectas muestra error inline. Logout redirige a `/login`. `/activar-cuenta` accesible sin sesión.

## Acceptance criteria

- [ ] La migración `create_auth_trigger` se aplicó sin errores en Supabase.
- [ ] La función `handle_new_user()` existe y es `SECURITY DEFINER`.
- [ ] El trigger `on_auth_user_created` está asociado a `auth.users` en `AFTER INSERT`.
- [ ] Insertar un usuario en `auth.users` con `raw_user_meta_data` válido crea automáticamente la fila en `public.users`.
- [ ] Login con `maxi@google.com` / `Abc123456@` redirige a `/`.
- [ ] Login con credenciales inválidas muestra "Email o contraseña incorrectos" inline, sin redirect.
- [ ] El botón "Iniciar sesión" permanece deshabilitado mientras email o password estén vacíos.
- [ ] El botón "Iniciar sesión" muestra estado de carga (deshabilitado o spinner) durante el submit.
- [ ] Logout cierra la sesión y redirige a `/login`.
- [ ] Acceder a `/` sin sesión activa redirige a `/login`.
- [ ] Acceder a `/ninos` sin sesión activa redirige a `/login`.
- [ ] `/login` es accesible sin sesión (no redirige).
- [ ] `/activar-cuenta` es accesible sin sesión (no redirige).
- [ ] El formulario de login mantiene los estilos y layout visual del mockup (tokens, tipografía, panel de branding).
- [ ] `LoginForm` es ahora un Client Component (`"use client"`).
- [ ] `signIn` y `signOut` son Server Actions (`'use server'`).
- [ ] El proxy (`proxy.ts`) usa `getClaims()` (no `getSession()`) para verificar autenticación.
- [ ] El botón de logout está visible en el layout autenticado (TopBar o sidebar).
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola.
- [ ] Todos los acceptance criteria de SPEC 03 y SPEC DB 02 siguen pasando (regresión).

## Decisions

- **Sí:** Server Actions en `app/(auth)/login/actions.ts` en lugar de API routes.
  - **Por qué:** Patrón recomendado por Next.js App Router para forms. Más simple, sin necesidad de endpoints REST separados.

- **Sí:** `LoginForm` como Client Component con estado local.
  - **Por qué:** Necesita validación inline, estado de carga y manejo de errores del Server Action. No se puede hacer con Server Components puros.

- **Sí:** Error inline retornado del Server Action (no redirect a `/error`).
  - **Por qué:** Mejor UX. El usuario ve el error sin perder el contexto del formulario. El ejemplo oficial de Supabase usa redirect a `/error` pero es menos amigable.

- **Sí:** `getClaims()` para verificar autenticación (no `getSession()`).
  - **Por qué:** `getSession()` no revalida el JWT y es inseguro. `getClaims()` valida y refresca el token. Es la recomendación oficial de `@supabase/ssr`.

- **Sí:** Protección de rutas en `proxy.ts` (raíz) invocando `updateSession()` de `utils/supabase/middleware.ts`.
  - **Por qué:** Next.js 16 renombró `middleware.ts` a `proxy.ts` y la función exportada de `middleware` a `proxy`. El archivo `proxy.ts` ya existe en el proyecto y es el punto centralizado para protección. La lógica de refresh de cookies vive en `updateSession()` (helper); la lógica de redirect puede ir en `proxy.ts` o dentro de `updateSession()`.

- **Sí:** Trigger `SECURITY DEFINER` en `auth.users`.
  - **Por qué:** Necesita permisos para insertar en `public.users` sin que el usuario tenga acceso directo. Patrón estándar de Supabase Auth.

- **Sí:** Trigger lee `raw_user_meta_data` para `daycare_id`, `role`, `status` y `full_name`.
  - **Por qué:** `signUp` acepta metadata arbitraria. El trigger la usa para crear la fila de dominio sin necesidad de un segundo paso. El schema de DB ya lo documenta.

- **Sí:** Post-login redirect a `/` sin importar rol.
  - **Por qué:** Solo existe el feed staff (SPEC 01). Cuando exista feed-familia, se diferencia en otra spec.

- **Sí:** Logout en la TopBar del layout autenticado.
  - **Por qué:** Visible en todas las rutas protegidas. Consistente con el patrón de layout actual (sidebar + TopBar).

- **No:** Incluir activar cuenta en esta spec.
  - **Por qué:** El flujo de invitación + código + signUp es complejo y merece su propia spec. Esta se enfoca en login + logout + protección.

- **No:** Recuperar contraseña.
  - **Por qué:** Requiere configuración de email templates en Supabase y UI propia. Fuera de scope.

- **No:** Rate limiting o bloqueo por intentos fallidos.
  - **Por qué:** Supabase Auth ya tiene rate limiting básico en el servidor. Agregar lógica en el cliente es over-engineering para esta fase.

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| El trigger `handle_new_user()` falla si `raw_user_meta_data` no tiene los campos esperados | La función usa `COALESCE` para `status` (default `'active'`). Si `daycare_id` o `role` son null, el INSERT falla con error de constraint — es intencional, no debe haber usuarios sin daycare ni rol. |
| El middleware protege rutas que no deberían estar protegidas | El matcher en `proxy.ts` ya excluye `_next/static`, `_next/image`, `favicon.ico` y assets. La lógica de protección excluye explícitamente `/login` y `/activar-cuenta`. |
| El usuario seed de SPEC DB 02 no tiene `email_confirmed_at` | La migración del seed ya setea `email_confirmed_at = now()`. Si Supabase Auth requiere email confirmado para login, el seed ya lo tiene. |
| Server Actions expone lógica sensible | Server Actions corren en el servidor; el cliente solo ve el resultado. No hay riesgo de exposición de credenciales. |

## What is **not** in este spec

- Activar cuenta con código de invitación (va en su propia spec).
- Recuperar contraseña / "¿Olvidaste tu contraseña?"
- Registro público sin invitación.
- Toggle Personal/Familia en el login.
- OAuth / proveedores sociales.
- Feed diferenciado por rol (staff vs parent).
- Verificación de email (Supabase Auth lo gestiona).
- Rate limiting o bloqueo por intentos fallidos.
- Dark mode.

Cada una de esas, si se implementa, va en su propia spec.
