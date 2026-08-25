# SPEC 04 — Modal Agregar niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-08-25
> **Objetivo:** Implementar la modal de agregar niño como overlay sobre `/ninos` con validación inline, que al guardar agrega el niño al listado en memoria.

## Scope

**In:**

- Modal overlay sobre la ruta `/ninos` (sin cambio de URL), replicando `reference/pantallas/agregar-nino.dc.html`.
- Componente `AddChildModal` (Client Component) en `app/_components/ninos/add-child-modal.tsx` — overlay con card centrada, header (Cancelar / "Agregar niño" / Guardar), campos: nombre completo (input), fecha de nacimiento (input dd/mm/aaaa), sala (select custom: Terra, Sol, Luna — sin selección por defecto), alergias (input, opcional), notas médicas (textarea, opcional).
- Validación inline de los 3 campos obligatorios: nombre no vacío, fecha con formato dd/mm/aaaa válido, sala seleccionada. Mensajes de error debajo de cada campo. Botón "Guardar" deshabilitado hasta que los 3 estén completos.
- Componente `NinosManager` (Client Component) en `app/_components/ninos/ninos-manager.tsx` — recibe `initialChildren: Child[]` por props, mantiene `useState` de la lista y del estado open/close de la modal. Renderiza header con botón "Agregar niño" (abre modal), input buscar, sección de sala, grid de KidCards, y `AddChildModal`.
- Al guardar: genera un nuevo `Child` con los datos del form (initial del nombre, colores rotativos del pool existente, `ageYears` calculado de la fecha, `birthdateLabel` formateado, `admissionLabel` como fecha actual, `allergens` parseado de texto separado por comas, `linkedParents: []`), lo agrega al estado y cierra la modal.
- Al cancelar o cerrar: resetea el form y cierra sin agregar.
- Actualización de `app/ninos/page.tsx` para usar `<NinosManager>` como Client Component wrapper, manteniendo el sidebar como Server Component fuera del manager.

**Out of scope (para specs futuras):**

- Persistencia a base de datos o localStorage — al refrescar la página los niños agregados se pierden.
- Edición de niños existentes.
- Eliminación de niños.
- Edición del perfil del niño desde la modal.
- Selección de foto/avatar del niño.
- Validación de duplicados (dos niños con el mismo nombre).
- Actualizar los `room` de los 8 niños mock de SPEC 02 (actualmente "Soles", el dropdown usa "Terra"/"Sol"/"Luna").
- Lógica de búsqueda/filtro real.

## Data model

Esta spec **no introduce nuevos tipos**. Reutiliza `Child` de `app/_lib/child-types.ts` (SPEC 02). El nuevo niño generado por la modal tiene esta forma:

```ts
const newChild: Child = {
  id: crypto.randomUUID(),
  name: formData.name,
  initial: formData.name[0].toUpperCase(),
  avatarBg: POOL[index].bg,
  avatarColor: POOL[index].color,
  ageYears: calcularEdad(formData.birthdate),
  birthdateLabel: formatearFecha(formData.birthdate),
  room: formData.room,
  admissionLabel: fechaHoy(),
  allergens: parseAllergens(formData.allergies),
  allergyNotes: formData.allergies || undefined,
  linkedParents: [],
};
```

Salas disponibles como constante:

```ts
const ROOMS = ["Terra", "Sol", "Luna"] as const;
type Room = (typeof ROOMS)[number];
```

## Implementation plan

1. **Helper functions:** crear `app/_lib/child-helpers.ts` con `calcularEdad(fecha: string): number`, `formatearFecha(fecha: string): string`, `parseAllergens(texto: string): string[]`, `fechaHoy(): string`. Sin dependencias externas — usa `Date` nativo.
2. **Pool de colores:** exportar desde `app/_lib/child-helpers.ts` el array `AVATAR_POOL` con los 6 pares `{ bg, color }` ya usados en el mock de SPEC 02. Helper `nextAvatarColor(index: number)` que rota con módulo.
3. **Componente AddChildModal:** crear `app/_components/ninos/add-child-modal.tsx` como Client Component. Props: `open: boolean`, `onClose: () => void`, `onSave: (child: Child) => void`. Overlay fijo con backdrop semi-transparente, card centrada max-width 520px replicando el mockup. Form con 5 campos + validación inline + botón disabled. Usa `useState` para valores del form y errores.
4. **Componente NinosManager:** crear `app/_components/ninos/ninos-manager.tsx` como Client Component. Props: `initialChildren: Child[]`. Estado: `children` (copia del prop), `isModalOpen`. Renderiza: header ("GESTIÓN" / "Niños" / botón "Agregar niño" que abre modal), input buscar (solo visual), sección sala, grid de `<KidCard>` sobre `children`, y `<AddChildModal>`.
5. **Actualizar `app/ninos/page.tsx`:** reemplazar el renderizado directo del listado por `<NinosManager initialChildren={mockChildren} />`. El sidebar y TopBar quedan fuera del manager como Server Components. El botón "Agregar niño" del mockup original ahora vive dentro de `NinosManager` y abre la modal.
6. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/ninos` muestra el listado; click en "Agregar niño" abre la modal; llenar form y guardar agrega el niño a la lista; cancelar cierra sin cambios; campos vacíos deshabilitan "Guardar" y muestran errores inline.

## Acceptance criteria

- [ ] Click en "Agregar niño" en `/ninos` abre la modal overlay sin cambiar la URL.
- [ ] La modal muestra header con "Cancelar" (cierra), título "Agregar niño", "Guardar" (disabled por defecto).
- [ ] La modal muestra los 5 campos: nombre completo, fecha de nacimiento, sala, alergias, notas médicas.
- [ ] El dropdown de sala muestra 3 opciones: "Terra", "Sol", "Luna" y arranca sin selección.
- [ ] Los campos alergias y notas médicas son opcionales (sin validación).
- [ ] Dejar nombre vacío y tocar Guardar muestra error inline "El nombre es obligatorio".
- [ ] Dejar fecha vacía muestra error inline "La fecha es obligatoria". Ingresar formato inválido (ej "abc" o "32/13/2020") muestra "Formato inválido (dd/mm/aaaa)".
- [ ] No seleccionar sala muestra error inline "Seleccioná una sala".
- [ ] El botón "Guardar" permanece deshabilitado mientras alguno de los 3 campos obligatorios esté incompleto o inválido.
- [ ] Al guardar con los 3 campos válidos, el niño nuevo aparece en el listado de `/ninos` con avatar (inicial + color rotativo), nombre, edad calculada, sala seleccionada, y badges de alergias si corresponde.
- [ ] Después de guardar, la modal se cierra y el form se resetea.
- [ ] Click en "Cancelar" cierra la modal sin agregar nada y resetea el form.
- [ ] Al refrescar la página, los niños agregados se pierden (solo viven en memoria).
- [ ] Los 8 niños originales del mock siguen apareciendo sin cambios.
- [ ] `AddChildModal` y `NinosManager` son Client Components (`"use client"`).
- [ ] `AddChildModal` no importa `mock-children.ts`; recibe datos por callbacks (`onSave`).
- [ ] `NinosManager` recibe `initialChildren` por props y no importa directamente el mock.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola al cargar `/ninos` ni al abrir/cerrar la modal.

## Decisions

- **Sí:** Modal como overlay sobre `/ninos`. El usuario lo describe como "modal" y evita crear una ruta nueva + layout separado.
- **No:** Ruta `/ninos/agregar`. Añade complejidad de navegación (botón back, layout) para un form simple.
- **Sí:** `NinosManager` como Client Component separado. La page sigue siendo Server Component para el sidebar; solo la sección interactiva es client.
- **No:** Convertir toda la page en Client Component. Rompería el patrón de specs anteriores y cargaría más JS del necesario.
- **Sí:** Validación inline con mensajes debajo de cada campo. UX estándar para forms; el usuario lo pidió explícitamente.
- **No:** Toast/snackbar global. Over-engineering para un form de 3 campos.
- **Sí:** Botón "Guardar" disabled hasta que los 3 campos estén válidos. Feedback inmediato, previene submits inválidos.
- **No:** Solo mensaje de error al submit. El usuario no entiende qué falta hasta que intenta guardar.
- **Sí:** Mock mutable en `useState` dentro de `NinosManager`. Suficiente para demo; la persistencia real va en otra spec.
- **No:** Persistencia en localStorage. El usuario dijo explícitamente que al refrescar se pierde; localStorage añadiría complejidad sin valor ahora.
- **Sí:** Salas como constantes `["Terra", "Sol", "Luna"]`. Fácil de extender y tipar.
- **No:** Hardcodear salas en el JSX. Duplica si se necesitan en otro lado.
- **Sí:** Allergens parseados de texto separado por comas y uppercased. Consistente con `Child.allergens: string[]` de SPEC 02 y con el badge "MANÍ"/"LACTOSA" del KidCard.
- **No:** Etiquetas tipo chips en el input de alergias. Añade complejidad de UI para valor marginal.
- **Sí:** Avatar con color rotativo del pool existente. Mantiene consistencia visual con los 8 niños del mock.
- **No:** Selector de color/avatar en el form. Fuera del alcance del mockup.
- **Sí:** `room` de los niños existentes queda como "Soles" (SPEC 02). No se modifican datos de otra spec.
- **No:** Actualizar los rooms del mock a "Sol"/"Terra"/"Luna". Es cambio de datos de SPEC 02, fuera de alcance.

## What is **not** in this spec

- Persistencia a base de datos o localStorage.
- Edición o eliminación de niños.
- Actualización de los rooms del mock existente.
- Lógica de búsqueda/filtro real.
- Selección de foto/avatar.
- Validación de duplicados.
- Navegación al perfil del niño recién creado.

Cada una de esas, si se implementa, va en su propia spec.
