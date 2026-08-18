# SPEC 03 — Login y activar cuenta

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-08-18
> **Objetivo:** Construir las pantallas de login y activar cuenta replicando `reference/pantallas/login.dc.html` (sin toggle Personal/Familia) y `reference/pantallas/activar-cuenta.dc.html` (solo UI, sin lógica de autenticación).

## Scope

**In:**

- Rutas `app/(auth)/login/page.tsx` y `app/(auth)/activar-cuenta/page.tsx` como containers.
- Layout compartido `app/(auth)/layout.tsx` — sin sidebar, fondo crema `#FBF4EC`, sin TopBar.
- Componente `LoginForm` presentacional en `app/_components/auth/login-form.tsx` — título "Iniciar sesión", subtítulo, input EMAIL, input CONTRASEÑA, link "¿Olvidaste tu contraseña?" (`href="#"`), botón "Iniciar sesión" (naranja, `href="/"`), pie "¿Te invitó la guardería? Activá tu cuenta" (`href="/activar-cuenta"`). Sin toggle Personal/Familia.
- Componente `ActivateAccountForm` presentacional en `app/_components/auth/activate-account-form.tsx` — ícono sol, título "Bienvenida a OpenDayCare", subtítulo, card de invitación (avatar + "Te invitaron a seguir a" + nombre niño · sala), input CÓDIGO DE INVITACIÓN, input EMAIL, input CREAR CONTRASEÑA, checkbox de autorización de fotos (estado visual checked), botón "Activar mi cuenta" (`href="#"`), pie "¿Ya tenés cuenta? Iniciar sesión" (`href="/login"`).
- Panel izquierdo de branding en login (gradiente coral + logo + texto + nombre de sala), visible solo en `≥768px`; en mobile se oculta y el formulario se centra.
- Inputs estáticos (valores hardcodeados replicando los mockups, sin `useState`).
- Todos los componentes son **Server Components** (sin `"use client"`) ya que no tienen interactividad ni estado.
- Links a pantallas no implementadas usan `href="#"` (excepto los que apuntan entre sí: `/login` ↔ `/activar-cuenta`).

**Out of scope (para specs futuras):**

- Lógica de autenticación, validación de formularios, manejo de errores, sesiones, tokens.
- Inputs con estado (`useState`/controlled) — esta spec es solo UI estática.
- Toggle Personal/Familia en el login.
- Backend, persistencia y datos reales.
- Navegación real post-login a feeds (staff/familia) — el botón "Iniciar sesión" usa `href="/"` que ya existe (SPEC 01).
- Pantallas feed-familia, avisos, mi-cuenta, foto.
- Dark mode.

## Data model

Esta spec **no introduce datos persistentes ni nuevos tipos**. Los formularios son estáticos con valores hardcodeados replicando los mockups:

- Login: email `caro@opendaycare.com`, contraseña vacía (placeholder `••••••••`).
- Activar cuenta: código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña `contraseña`, checkbox checked, niño `Mateo · Sala Soles`, avatar inicial `M` con colores `#A9D9E8`/`#1F7A93`.

## Implementation plan

1. **Layout compartido:** crear `app/(auth)/layout.tsx` — fondo `bg-auth-bg` (token de `@theme inline`), sin sidebar ni TopBar, children centrados. Las rutas existentes (`app/page.tsx`, `app/ninos/`) quedan fuera del grupo.
2. **Tokens:** en `app/globals.css` añadir a `@theme inline` — `--color-auth-bg` `#FBF4EC`; `--color-auth-brand-start` `#F6A98E` / `--color-auth-brand-mid` `#F2937A` / `--color-auth-brand-end` `#EC7E62`; `--color-auth-input-border` `#EADFD0`; `--color-auth-input-text` `#3F362E`; `--color-auth-muted` `#94887B`; `--color-auth-link` `#C5503A`; `--color-auth-btn-start` `#F4977E` / `--color-auth-btn-end` `#EE8164`; `--color-auth-invite-bg` `#A9D9E8` / `--color-auth-invite-text` `#1F7A93`; `--color-auth-consent-bg` `#FBF1D6` / `--color-auth-consent-text` `#8A7234`; `--color-auth-consent-check` `#5FB97E`.
3. **Componente LoginForm:** crear `app/_components/auth/login-form.tsx` — presentacional, sin imports de data. Renderiza: título "Iniciar sesión" (Fredoka 30px), subtítulo, label "EMAIL" + input con valor `caro@opendaycare.com`, label "CONTRASEÑA" + input password con placeholder, link "¿Olvidaste tu contraseña?" (`href="#"`), botón naranja "Iniciar sesión" (`href="/"`), pie con link "Activá tu cuenta" (`href="/activar-cuenta"`).
4. **Componente ActivateAccountForm:** crear `app/_components/auth/activate-account-form.tsx` — presentacional. Renderiza: ícono sol (gradiente), título "Bienvenida a OpenDayCare" (Fredoka 32px), subtítulo, card invitación (avatar "M" + "Te invitaron a seguir a" + "Mateo · Sala Soles"), label "CÓDIGO DE INVITACIÓN" + input con valor `7K4P9` (Fredoka, letter-spacing), label "EMAIL" + input, label "CREAR CONTRASEÑA" + input password, checkbox consentimiento (checked visual, fondo amarillo), botón "Activar mi cuenta" (`href="#"`), pie con link "Iniciar sesión" (`href="/login"`).
5. **Página Login (container):** crear `app/(auth)/login/page.tsx` — layout split en `≥768px`: izquierda panel branding (gradiente coral con círculos decorativos, logo OpenDaycare, título "El día de cada niño…", subtítulo, nombre sala); derecha `<LoginForm />` centrado. En `<768px` el panel se oculta y el form ocupa todo el ancho centrado.
6. **Página Activar cuenta (container):** crear `app/(auth)/activar-cuenta/page.tsx` — `<ActivateAccountForm />` centrado, max-width 440px, sin panel de branding.
7. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/login` coincide visualmente con `reference/screenshots/login.png` (sin toggle) y `/activar-cuenta` con `reference/screenshots/activar-cuenta.png`.

## Acceptance criteria

- [ ] `app/(auth)/login/page.tsx` renderiza el login en `/login`.
- [ ] `app/(auth)/activar-cuenta/page.tsx` renderiza la activación en `/activar-cuenta`.
- [ ] El layout compartido `app/(auth)/layout.tsx` no renderiza sidebar ni TopBar.
- [ ] La página Login muestra el panel de branding a la izquierda (gradiente coral, logo, título, subtítulo, nombre sala) en `≥768px`.
- [ ] La página Login oculta el panel de branding en `<768px` y el formulario se centra.
- [ ] El LoginForm NO tiene toggle Personal/Familia.
- [ ] El LoginForm muestra título "Iniciar sesión" (Fredoka 30px) y subtítulo "Ingresá para ver el día de hoy.".
- [ ] El LoginForm muestra input EMAIL con valor `caro@opendaycare.com` e input CONTRASEÑA con placeholder `••••••••`.
- [ ] El LoginForm muestra link "¿Olvidaste tu contraseña?" con `href="#"`.
- [ ] El LoginForm muestra botón naranja "Iniciar sesión" con `href="/"`.
- [ ] El LoginForm muestra pie "¿Te invitó la guardería? Activá tu cuenta" con link a `/activar-cuenta`.
- [ ] El ActivateAccountForm muestra ícono sol con gradiente y título "Bienvenida a OpenDayCare" (Fredoka 32px).
- [ ] El ActivateAccountForm muestra card de invitación con avatar "M" (fondo `#A9D9E8`, texto `#1F7A93`) y texto "Te invitaron a seguir a" + "Mateo · Sala Soles".
- [ ] El ActivateAccountForm muestra input CÓDIGO DE INVITACIÓN con valor `7K4P9` en tipografía Fredoka con letter-spacing.
- [ ] El ActivateAccountForm muestra input EMAIL con valor `lucia.fernandez@gmail.com` e input CREAR CONTRASEÑA con valor `contraseña`.
- [ ] El ActivateAccountForm muestra checkbox de autorización de fotos visualmente checked (fondo amarillo `#FBF1D6`, check verde `#5FB97E`).
- [ ] El ActivateAccountForm muestra botón "Activar mi cuenta" con `href="#"`.
- [ ] El ActivateAccountForm muestra pie "¿Ya tenés cuenta? Iniciar sesión" con link a `/login`.
- [ ] Todos los inputs son estáticos (sin `useState`, sin handlers).
- [ ] `LoginForm`, `ActivateAccountForm` y ambas páginas son **Server Components** (sin `"use client"`).
- [ ] `LoginForm` y `ActivateAccountForm` no importan datos externos; reciben toda su data por props o literales internos.
- [ ] Los tokens nuevos en `app/globals.css` están definidos en `@theme inline`.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola al cargar `/login` ni `/activar-cuenta`.

## Decisions

- **Sí:** Grupo de rutas `app/(auth)/` con layout compartido. Aísla las pantallas sin sidebar del resto de la app y permite agregar más rutas auth (recuperar contraseña) sin tocar el layout root.
- **No:** Páginas sueltas sin layout compartido. Cada una duplicaría el fondo crema y la ausencia de sidebar.
- **Sí:** Sin toggle Personal/Familia. El usuario lo pidió explícitamente; simplifica el form y evita decisiones de routing post-login.
- **No:** Mantener el toggle. Añade complejidad de UI y lógica de routing que no se necesita ahora.
- **Sí:** Inputs estáticos sin `useState`. Consistente con las specs 01 y 02 (solo UI); la lógica de forms va con el backend.
- **No:** Inputs controlados con estado. Añade lógica fuera del alcance de esta spec.
- **Sí:** Panel branding visible solo en `≥768px`. En mobile el espacio no alcanza para un split legible; el form centrado es más usable.
- **No:** Mantener el split en mobile. Rompe el layout y el branding queda ilegible.
- **Sí:** Botón "Iniciar sesión" apunta a `/` (feed staff de SPEC 01). Es la única pantalla de destino que existe; cuando exista feed-familia se ajusta en otra spec.
- **No:** Botón apunta a un feed-familia inexistente. Crearía una ruta 404.
- **Sí:** Botón "Activar mi cuenta" con `href="#"`. El feed-familia destino no existe aún.
- **No:** Crear una ruta placeholder para el feed-familia. Trabajo duplicado que se reescribe en su spec.
- **Sí:** Todos los tokens en `@theme inline`. Sigue el stack Tailwind v4 CSS-first de las specs anteriores.
- **No:** Estilos inline del mockup. Ensucian el JSX y desactivan Tailwind.
- **Sí:** Patrón presentational/container como en specs 01 y 02. Los forms reciben props; las páginas son containers.
- **Sí:** Server Components (sin `"use client"`). No hay interactividad ni estado; los inputs son estáticos. Menos JavaScript al cliente, mejor performance.
- **No:** Client Components con `"use client"`. Innecesario sin handlers ni estado.
- **Sí:** Card de invitación con datos hardcodeados (Mateo, Sala Soles). El mockup muestra un caso específico; cuando haya backend, los datos vendrán del token de invitación.

## What is **not** in this spec

- Lógica de autenticación, validación, manejo de errores o sesiones.
- Toggle Personal/Familia en el login.
- Inputs con estado (`useState`) o handlers de submit.
- Backend, persistencia, tokens de invitación reales.
- Navegación real post-login a feeds diferenciados (staff/familia).
- Pantallas feed-familia, recuperar contraseña, avisos, mi-cuenta.
- Dark mode.
