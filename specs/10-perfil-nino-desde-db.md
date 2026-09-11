# SPEC 10 — Perfil de niño conectado a Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 09
> **Fecha:** 2026-09-11
> **Objetivo:** Conectar la página de perfil de niño (`/ninos/[id]`) a Supabase para que al hacer click en una tarjeta de la lista se muestre la ficha real del niño con datos de la base, reemplazando la resolución por mock data.

## Scope

**In:**

- Reemplazar `getChildById(id)` (de `mock-children.ts`) por un query a Supabase que busque el niño por UUID en la tabla `children`.
- Query con JOIN a `rooms` (`.select("*, rooms(id, name)")`) para resolver el nombre de la sala en el mismo round-trip.
- Mapeo de la fila `DbChild` al tipo UI `Child` usando `mapDbChildToChild()` (ya existente en `child-helpers.ts`), pasando `linkedParents: []` (no hay tabla `parent_children` aún).
- Manejo de niño no encontrado con `notFound()` de Next.js (404 en lugar de mensaje inline).
- Eliminar el import de `mock-children.ts` de `app/ninos/[id]/page.tsx`.
- La RLS policy `children_read` de SPEC 09 ya permite SELECT por ID — no se requieren cambios de RLS.

**Out of scope (para specs futuras):**

- Tabla `parent_children` y población real de padres vinculados en el perfil.
- Edición del niño desde el perfil (botón "Editar" → `href="#"` sigue).
- Pantalla "Resumen del día" (botón → `href="#"` sigue).
- Vinculación real de padres (modal de vinculación persiste solo en memoria).
- Upload de foto/avatar del niño.
- Edición o eliminación de niños.
- Búsqueda/filtro de niños en la lista.
- Políticas UPDATE/DELETE en `children`.

## Data model

Esta spec **no introduce nuevas estructuras de datos**. Reutiliza `DbChild` y `DbRoom` de `app/_lib/db-types.ts`, `Child` de `app/_lib/child-types.ts`, y `mapDbChildToChild()` de `app/_lib/child-helpers.ts`.

El query a Supabase es:

```ts
const { data: childRow, error } = await supabase
  .from("children")
  .select("*, rooms(id, name)")
  .eq("id", id)
  .single();
```

El resultado se mapea a `Child` con `mapDbChildToChild(childRow, childRow.rooms.name, 0)`. El `index` para colores de avatar se fija en `0` porque es un solo niño — el color es determinístico para la vista de perfil.

## Implementation plan

1. **Actualizar imports en `app/ninos/[id]/page.tsx`:** eliminar el import de `getChildById` de `mock-children.ts`. Agregar imports de `createClient` (de `@/utils/supabase/server`) y `cookies` de `next/headers`. Importar `notFound` de `next/navigation`. Importar `DbChild` de `db-types.ts`. Importar `mapDbChildToChild` de `child-helpers.ts`.

2. **Agregar query a Supabase:** dentro de `NinosIdPage`, después de extraer `id` de `params`, crear cliente Supabase con `createClient(await cookies())`. Ejecutar query `children` con `.select("*, rooms(id, name)").eq("id", id).single()`. Si hay error o `data` es null, llamar `notFound()`.

3. **Mapear resultado:** extraer `childRow` del resultado. El tipo del resultado incluye `rooms: { id, name }` por el JOIN. Resolver `roomName = childRow.rooms.name`. Llamar `mapDbChildToChild(childRow, roomName, 0)` para obtener el `Child` UI.

4. **Verificar que `ParentsSection` funciona con `linkedParents: []`:** el componente ya maneja lista vacía (muestra "Vincular otro padre" sin padres listados). Sin cambios necesarios.

5. **Verificación final:** `npm run lint` y `npx tsc --noEmit` pasan. `npm run dev`: crear un niño en `/ninos`, hacer click en la tarjeta navega a `/ninos/{uuid}` y muestra el perfil con datos reales (nombre, edad, sala, alergias, fecha de nacimiento, ingreso). El botón "Volver a Niños" regresa a `/ninos`. Un UUID inválido muestra 404. El import de `mock-children.ts` fue eliminado de `[id]/page.tsx`.

## Acceptance criteria

- [ ] `/ninos/{uuid}` de un niño existente muestra el perfil con datos reales de Supabase (nombre, edad calculada, sala, fecha de nacimiento, alergias, notas médicas, fecha de ingreso).
- [x] El import de `getChildById` / `mock-children.ts` fue eliminado de `app/ninos/[id]/page.tsx`.
- [x] El perfil se resuelve con un query a `children` con JOIN a `rooms` (no hay query separado para la sala).
- [x] La página usa `notFound()` de Next.js cuando el UUID no existe en la DB (respuesta HTTP 404).
- [x] `mapDbChildToChild()` se reutiliza para el mapeo (no hay lógica de mapeo duplicada en la página).
- [x] `ParentsSection` renderiza correctamente con `linkedParents: []` (lista vacía, muestra solo "Vincular otro padre").
- [x] El botón "Editar" sigue siendo `href="#"` (no funcional).
- [x] El botón "Resumen del día" sigue siendo `href="#"` (no funcional).
- [x] El link "Volver a Niños" apunta a `/ninos` y funciona correctamente.
- [x] La RLS policy `children_read` permite el SELECT por ID sin cambios (regresión de SPEC 09).
- [ ] Click en una KidCard en `/ninos` navega al perfil correcto del niño (el UUID coincide).
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola.

## Decisions

- **Sí:** Query con `.select("*, rooms(id, name)")` (JOIN embed de PostgREST).
  - **Por qué:** Resuelve el nombre de la sala en el mismo round-trip. Supabase/PostgREST soporta JOINs implícitos por FK sin configuración adicional. Evita un segundo query.

- **Sí:** `mapDbChildToChild()` con `index: 0` para el color de avatar en perfil.
  - **Por qué:** En la vista de perfil hay un solo niño. El color es cosmético y determinístico para la vista individual. No necesita coincidir con el color de la tarjeta en la lista (que rota por posición).

- **Sí:** `notFound()` de Next.js en lugar de mensaje inline "Niño no encontrado".
  - **Por qué:** Es el patrón correcto de App Router para recursos que no existen. Genera respuesta HTTP 404 real, permite custom `not-found.tsx` en el futuro, y es más limpio que un fallback inline.

- **Sí:** No tocar `ParentsSection` ni el flujo de vinculación.
  - **Por qué:** La tabla `parent_children` no existe aún. Los padres vinculados se manejan en memoria (SPEC 06). Conectarlos a DB es una spec separada.

- **No:** Agregar Server Action para fetch del perfil.
  - **Por qué:** La página ya es Server Component. El query directo a Supabase en el Server Component es el patrón estándar. Un Server Action sería innecesario para una lectura.

- **No:** Cambiar la política RLS de `children`.
  - **Por qué:** `children_read` de SPEC 09 ya filtra por daycare del usuario autenticado. El SELECT por ID individual pasa por la misma política. No hay riesgo de fuga de datos.

## What is **not** in este spec

- Tabla `parent_children` ni población real de padres vinculados.
- Edición del niño desde el perfil.
- Pantalla "Resumen del día".
- Vinculación real de padres a la base de datos.
- Upload de foto/avatar del niño.
- Edición o eliminación de niños.
- Búsqueda/filtro de niños en la lista.
- Políticas UPDATE/DELETE en `children`.

Cada una de esas, si se implementa, va en su propia spec.
