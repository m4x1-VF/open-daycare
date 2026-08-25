# SPEC 06 — Modal Vincular Padre

> **Estado:** Implementada
> **Depende de:** SPEC 02, SPEC 05
> **Fecha:** 2026-08-25
> **Objetivo:** Implementar la modal de vincular padre como overlay sobre el perfil del niño, replicando `reference/pantallas/vincular-padre.dc.html`, con form validado, código de invitación random y el padre nuevo apareciendo en `ParentsCard` con estado PENDIENTE.

## Scope

**In:**

- Componente `LinkParentModal` (Client Component) en `app/_components/ninos/link-parent-modal.tsx` — overlay sobre la ruta `/ninos/[id]` reutilizando el patrón de animación de SPEC 05 (`.modal-overlay` + `.modal-card` con `data-state`). Card max-width 480px replicando el mockup: header ("Vincular padre" + "a {child.name}" + botón X cerrar), banner info azul, campos nombre y email, selector de parentesco (Mamá/Papá/Tutor/a como pill buttons), card de código de invitación (amarillo, código random 5 chars + "Vence en 7 días"), botón "Enviar invitación" (gradiente coral).
- Validación inline: nombre no vacío, email con `includes("@")` y dominio con `.`, parentesco seleccionado. Validación de duplicado: si ya existe un padre con el mismo email en `linkedParents`, error inline.
- Código de invitación: generado random al abrir la modal (5 caracteres alfanuméricos uppercase).
- Componente `ParentsSection` (Client Component) en `app/_components/ninos/parents-section.tsx` — wrapper que recibe `child: Child`, mantiene `useState` de la lista de padres y del estado open/close de la modal. Renderiza `<ParentsCard>` + `<LinkParentModal>`.
- Cambio en `ParentsCard`: `<a href="#">` → `<button onClick={onLinkParent}>` con nueva prop `onLinkParent: () => void`. Sigue siendo presentacional (server component).
- Al enviar invitación: genera un `LinkedParent` con los datos del form (avatar del pool rotativo, `role` mapeado de la selección, `status: "pending"`, `statusLabel: "PENDIENTE"`), lo agrega al estado y cierra la modal.
- Persistencia solo en memoria: al refrescar, los padres vinculados se pierden.
- Tokens nuevos en `app/globals.css` para la invite code card: `--color-invite-border` (`#E6D08A`), `--color-invite-label` (`#A88526`).

**Out of scope (para specs futuras):**

- Envío real de email con el código de invitación.
- Verificación del código de invitación (flujo de activar cuenta).
- Persistencia a base de datos o localStorage.
- Edición o eliminación de padres vinculados.
- Reenvío de invitación.
- Expiración real del código (solo se muestra "Vence en 7 días" como texto).
- Trap focus dentro de la modal (Tab cycling).
- Modo oscuro / dark mode.

## Data model

Esta spec **no introduce nuevos tipos**. Reutiliza `LinkedParent` y `Child` de `app/_lib/child-types.ts` (SPEC 02). El nuevo padre generado por la modal tiene esta forma:

```ts
const newParent: LinkedParent = {
  id: crypto.randomUUID(),
  name: formData.name,
  initial: formData.name[0].toUpperCase(),
  avatarBg: POOL[index].bg,
  avatarColor: POOL[index].color,
  role: formData.role,        // "mom" | "dad" | "guardian"
  roleLabel: ROLE_LABELS[formData.role],
  status: "pending",
  statusLabel: "PENDIENTE",
};
```

Parentesco como constante:

```ts
const ROLES = [
  { value: "mom" as const, label: "Mamá" },
  { value: "dad" as const, label: "Papá" },
  { value: "guardian" as const, label: "Tutor/a" },
] as const;
```

Código de invitación:

```ts
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
```

## Implementation plan

1. **Tokens:** en `app/globals.css` añadir a `@theme inline` — `--color-invite-border` `#E6D08A` (border dashed de la invite card); `--color-invite-label` `#A88526` (labels y texto de expiración).

2. **Helper de código:** crear `app/_lib/invite-helpers.ts` con `generateInviteCode()` (5 chars alfanuméricos uppercase) y `ROLES` constant. Sin dependencias externas.

3. **Componente LinkParentModal:** crear `app/_components/ninos/link-parent-modal.tsx` como Client Component. Props: `open: boolean`, `onClose: () => void`, `onSave: (parent: LinkedParent) => void`, `childName: string`, `existingEmails: string[]`. Overlay fijo con `data-state` reutilizando `.modal-overlay` y `.modal-card` de SPEC 05. Form con: banner info, input nombre, input email, selector de parentesco (3 pill buttons), card de código de invitación (solo lectura, generado al abrir), botón "Enviar invitación". Validación inline con `touched` por campo. Escape cierra, click fuera cierra, body scroll lock, auto-focus en nombre, `prefers-reduced-motion`.

4. **Componente ParentsSection:** crear `app/_components/ninos/parents-section.tsx` como Client Component. Props: `child: Child`. Estado: `parents` (copia de `child.linkedParents`), `isModalOpen`. Renderiza `<ParentsCard parents={parents} onLinkParent={openModal} />` + `<LinkParentModal open={isModalOpen} childName={child.name} existingEmails={emails} onClose={closeModal} onSave={handleSave} />`. `handleSave`: asigna avatar del pool, agrega al estado, cierra modal.

5. **Actualizar ParentsCard:** cambiar `<a href="#">` por `<button type="button" onClick={onLinkParent}>` con nueva prop `onLinkParent: () => void`. Mantener todo lo demás como server component presentacional.

6. **Actualizar `app/ninos/[id]/page.tsx`:** reemplazar `<ParentsCard parents={child.linkedParents} />` por `<ParentsSection child={child} />`. El sidebar y TopBar quedan fuera como Server Components.

7. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/ninos/mateo` muestra `ParentsCard` con 2 padres existentes; click en "Vincular otro padre" abre la modal; llenar form y enviar agrega el padre con estado PENDIENTE; cancelar cierra sin cambios; código de invitación se genera random al abrir; email duplicado muestra error inline.

## Acceptance criteria

- [x] Click en "Vincular otro padre" en `ParentsCard` abre la modal overlay sin cambiar la URL.
- [x] La modal muestra header "Vincular padre" + subtítulo "a {child.name}" + botón X (cierra).
- [x] La modal muestra el banner info azul con el texto del mockup.
- [x] La modal muestra los campos: nombre del padre/madre (input), email (input email), parentesco (3 pill buttons: Mamá, Papá, Tutor/a).
- [x] La modal muestra la card de código de invitación (fondo amarillo, border dashed) con un código de 5 caracteres alfanuméricos generado random al abrir.
- [x] El código de invitación cambia cada vez que se abre la modal.
- [x] El campo parentesco no tiene selección por defecto — los 3 pills arrancan sin selección.
- [x] Seleccionar un parentesco lo marca visualmente (fondo azul, border azul) y deselecciona los otros.
- [x] Nombre vacío muestra error inline "El nombre es obligatorio".
- [x] Email vacío muestra error inline "El email es obligatorio".
- [x] Email sin `@` o sin dominio válido muestra error inline "Formato de email inválido".
- [x] Email duplicado (ya existe en `linkedParents`) muestra error inline "Ya existe un padre vinculado con ese email".
- [x] El botón "Enviar invitación" permanece deshabilitado mientras algún campo obligatorio esté incompleto, inválido o el parentesco no esté seleccionado.
- [x] Al enviar con todos los campos válidos, el padre nuevo aparece en `ParentsCard` con avatar (inicial + color rotativo), nombre, roleLabel y badge PENDIENTE.
- [x] Después de enviar, la modal se cierra y el form se resetea.
- [x] Click en X o en el overlay cierra la modal sin agregar nada y resetea el form.
- [x] Escape cierra la modal.
- [x] El body no hace scroll cuando la modal está abierta.
- [x] La modal muestra animación de entrada (scale + opacity ~200ms) y salida (~150ms).
- [x] Con `prefers-reduced-motion: reduce`, las animaciones de escala se eliminan.
- [x] Auto-focus en el input de nombre al abrir la modal.
- [x] Al refrescar la página, los padres vinculados se pierden (solo viven en memoria).
- [x] Los padres existentes del mock (ej: Lucía y Diego en Mateo) siguen apareciendo sin cambios.
- [x] `LinkParentModal` y `ParentsSection` son Client Components (`"use client"`).
- [x] `LinkParentModal` no importa `mock-children.ts`; recibe datos por callbacks.
- [x] `ParentsSection` recibe `child` por props y no importa directamente el mock.
- [x] `ParentsCard` sigue siendo presentacional (server component) y recibe `onLinkParent` por props.
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [x] `npm run dev` no registra errores en consola.
- [x] Todos los acceptance criteria de SPEC 02 y SPEC 05 siguen pasando (regresión).

## Decisions

- **Sí:** Modal como overlay sobre `/ninos/[id]` reutilizando el patrón de SPEC 05.
  - **Por qué:** Consistencia visual y de UX con la modal de agregar niño. El usuario la describió como "modal como la que hicimos en la spec anterior".

- **No:** Ruta `/ninos/[id]/vincular-padre`. Añade complejidad de navegación para un form simple.

- **Sí:** `ParentsSection` como Client Component wrapper, `ParentsCard` sigue siendo server component presentacional.
  - **Por qué:** Sigue el patrón container/presentational de specs anteriores. El wrapper maneja estado; el presentacional solo renderiza.

- **Sí:** `ParentsCard` recibe callback `onLinkParent` y cambia `<a>` por `<button>`.
  - **Por qué:** Semánticamente es una acción (abrir modal), no navegación. El callback mantiene `ParentsCard` presentacional.

- **Sí:** Código de invitación random de 5 caracteres alfanuméricos uppercase.
  - **Por qué:** Más realista que hardcodear. Costo mínimo (función de 3 líneas).

- **Sí:** El código se regenera cada vez que se abre la modal.
  - **Por qué:** Cada invitación es independiente. Si el usuario cancela y vuelve a abrir, tiene sentido un código nuevo.

- **Sí:** Validación de duplicado por email.
  - **Por qué:** Evita confusión de vincular el mismo padre dos veces. Error inline es suficiente.

- **Sí:** Check de email simple (`includes("@")` + dominio con `.`).
  - **Por qué:** Suficiente para demo sin backend. Regex estricto es over-engineering cuando no hay envío real.

- **Sí:** Parentesco obligatorio sin default (como sala en SPEC 04).
  - **Por qué:** Fuerza al usuario a elegir conscientemente. Evita vincular como "Mamá" por error.

- **No:** Envío real de email.
  - **Por qué:** Fuera del alcance de esta fase. Requiere backend + servicio de email.

- **No:** Expiración real del código.
  - **Por qué:** "Vence en 7 días" es solo texto en la UI. Sin backend no hay forma de verificar expiración.

- **No:** Trap focus (Tab cycling).
  - **Por qué:** Over-engineering para una modal con pocos elementos focuseables. Consistente con decisión de SPEC 05.

- **No:** Usar Framer Motion.
  - **Por qué:** CSS transitions son suficientes, más performantes, menos bundle. Consistente con SPEC 05.

## Mejoras de diseño propuestas (para iteración futura)

- **Copy del banner:** El texto actual es largo ("Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo."). Considerar acortar a "Enviaremos un código de activación a este email."
- **Botón "Copiar código":** Un botón pequeño junto al código de invitación para copiarlo al portapapeles. Útil cuando se implemente el envío real.
- **Transición del código:** Cuando se regenera al abrir, una micro-animación (fade out → fade in) del código haría el cambio más natural.
- **Color del código:** El código "7K4P9" en el mock tiene `letter-spacing: 7px` — genera buena legibilidad. Mantener.
- **Pill buttons de parentesco:** La transición entre selected/unselected podría tener un `transition-colors duration-200` para suavizar el cambio.
- **Focus ring en pills:** Los pill buttons no tienen focus ring visible — agregarlo para accesibilidad de teclado.

## What is **not** in this spec

- Envío real de email con el código de invitación.
- Verificación del código (flujo de activar cuenta).
- Persistencia a base de datos o localStorage.
- Edición o eliminación de padres vinculados.
- Reenvío de invitación.
- Expiración real del código.
- Trap focus dentro de la modal.
- Modo oscuro / dark mode.
- Cambios en el diseño del mockup (se replica fielmente).

Cada una de esas, si se implementa, va en su propia spec.
