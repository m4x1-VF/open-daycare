# SPEC 02 — Pantallas de Niños: listado y perfil

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-17
> **Objetivo:** Construir las pantallas de listado y perfil de niño en `app/ninos/` replicando `reference/pantallas/ninos.dc.html` y `reference/pantallas/perfil-nino.dc.html` (solo UI, sin lógica de negocio).

## Scope

**In:**

- Rutas `app/ninos/page.tsx` (lista) y `app/ninos/[id]/page.tsx` (perfil dinámico) como containers.
- Refactor del `Sidebar` existente (`app/_components/feed/sidebar.tsx`) para recibir prop `activeItem: "feed" | "ninos" | "avisos" | "cuenta"`. Marca "Niños" activo en ambas rutas nuevas. `app/page.tsx` se actualiza para pasar `activeItem="feed"` (regresión nula).
- Componente `Avatar` reusable en `app/_components/ui/avatar.tsx` (props `initial`, `avatarBg`, `avatarColor`, `size: "sm" | "md" | "lg"` → 40/48/84px).
- Componente `KidCard` presentacional en `app/_components/ninos/kid-card.tsx` — avatar + nombre + "edad · padres" + slot derecho (badge alérgeno > badge VINCULAR > chevron).
- Componente `ChildProfileHeader` en `app/_components/ninos/child-profile-header.tsx` — avatar 84px + nombre + "edad · Sala" + botón "Editar".
- Componente `AllergiesCard` en `app/_components/ninos/allergies-card.tsx` — card rosa con ícono warning + "Alergias y notas" + texto.
- Componente `ChildDetails` en `app/_components/ninos/child-details.tsx` — lista key-value (fecha nacimiento, sala, ingreso).
- Componente `ParentsCard` en `app/_components/ninos/parents-card.tsx` — "PADRES VINCULADOS" + lista de padres + link "Vincular otro padre".
- Mock data tipado en `app/_lib/mock-children.ts` (8 niños replicando `ninos.dc.html`) + tipos en `app/_lib/child-types.ts` (`Child`, `LinkedParent`, `NavItem`).
- Tokens nuevos en `app/globals.css` para: badge alérgeno, badge VINCULAR, card de alergias, badges de estado de padres (ACTIVA/PENDIENTE).
- Layout lista: header "GESTIÓN" + "Niños" + botón "Agregar niño", input "Buscar niño…" (solo visual), sección "SALA SOLES · 8 niños", grid 2 columnas de KidCards.
- Layout perfil: link "Volver a Niños", columna izquierda (header + allergies + details), columna derecha 300px (botón "Resumen del día" + ParentsCard).
- TopBar mobile existente se reutiliza tal cual en ambas rutas.

**Out of scope (para specs futuras):**

- Lógica de búsqueda/filtro sobre el input "Buscar niño…" (solo visual).
- Backend, persistencia, autenticación y datos reales.
- Navegación real a pantallas referenciadas (Agregar niño, Resumen del día, Editar, Vincular otro padre, badge VINCULAR) — todas `href="#"`.
- Pantallas agregar-nino, vincular-padre, resumen-dia, editar-nino, avisos, mi-cuenta.
- Retroalimentar `PostCard`/`Composer`/`Sidebar` para usar el nuevo `Avatar` (toca SPEC 01, fuera de alcance).
- Clean/Hexagonal architecture completa — diferida como en SPEC 01.
- Dark mode.

## Data model

Esta spec **no introduce datos persistentes**. Mock estático tipado en código:

```ts
// app/_lib/child-types.ts
export type NavItem = "feed" | "ninos" | "avisos" | "cuenta";

export interface LinkedParent {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  role: "mom" | "dad" | "guardian";
  roleLabel: string;   // "Mamá" / "Papá"
  status: "active" | "pending";
  statusLabel: string; // "ACTIVA" / "PENDIENTE"
}

export interface Child {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  ageYears: number;
  birthdateLabel: string;   // "12 mar 2022"
  room: string;             // "Soles"
  admissionLabel: string;   // "feb 2025"
  allergens: string[];      // ["MANÍ"] / ["LACTOSA"] / []
  allergyNotes?: string;    // "Alergia al maní. Evitar frutos secos…"
  linkedParents: LinkedParent[];
}
```

El mock exporta 8 niños replicando `ninos.dc.html` (Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia) con sus avatares, edades, padres y alérgenos. El perfil de Mateo (`perfil-nino.dc.html`) se construye con el mismo registro del mock (id `"mateo"`), que lleva `allergyNotes` y 2 padres (Lucía activa, Diego pendiente). Helper `getChildById(id)` para resolver el perfil.

## Implementation plan

1. **Tipos:** crear `app/_lib/child-types.ts` con `NavItem`, `LinkedParent` y `Child`. Sin dependencias externas.
2. **Tokens:** en `app/globals.css` añadir a `@theme inline` — `--color-allergy-badge-bg` `#FBD8CC` / `--color-allergy-badge` `#D9684A`; `--color-link-badge-bg` `#F9D2DE` / `--color-link-badge` `#C56486`; `--color-allergy-card-bg` `#FBDAD6`; `--color-allergy-icon-bg` `#F4A8A0`; `--color-allergy-title` `#C5413A`; `--color-allergy-text` `#B25249`; `--color-status-active-bg` `#CFEBD8` / `--color-status-active` `#3E9B6C`; `--color-status-pending-bg` `#F7E7A6` / `--color-status-pending` `#9A7B1E`.
3. **Mock data:** crear `app/_lib/mock-children.ts` con `mockChildren: Child[]` (8 items) + `getChildById(id: string): Child | undefined`. Mateo lleva `allergyNotes` y padres Lucía (activa) + Diego (pendiente).
4. **Avatar (UI):** crear `app/_components/ui/avatar.tsx` — presentacional, props `{ initial, avatarBg, avatarColor, size }`. Sin imports de data.
5. **Refactor Sidebar:** modificar `app/_components/feed/sidebar.tsx` para recibir `activeItem: NavItem = "feed"` y aplicar clases activas al item correspondiente (`bg-nav-active-bg text-nav-active-text font-extrabold`) vs inactivas (`text-nav-inactive font-semibold`). Quitar el hardcoded "Feed activo".
6. **Actualizar `app/page.tsx`:** pasar `activeItem="feed"` al `<Sidebar />`. UI visual sin cambios respecto a SPEC 01.
7. **Componente KidCard:** crear `app/_components/ninos/kid-card.tsx` — recibe `child: Child`. Renderiza `<Avatar size="md">` + nombre (Fredoka) + "edad · N padres vinculados" o "sin padres vinculados" + slot derecho con lógica: `allergens[0]` → badge alérgeno; si no y `linkedParents.length === 0` → badge VINCULAR; sino → chevron. Toda la card es `<a href="#">`.
8. **Componente ChildProfileHeader:** crear `app/_components/ninos/child-profile-header.tsx` — `<Avatar size="lg">` + nombre (Fredoka 28px) + "edad · Sala X" + `<a href="#">Editar</a>`.
9. **Componente AllergiesCard:** crear `app/_components/ninos/allergies-card.tsx` — recibe `notes: string`. Card rosa con ícono warning + título "Alergias y notas" + texto.
10. **Componente ChildDetails:** crear `app/_components/ninos/child-details.tsx` — recibe `child: Child`. Filas key-value: "Fecha de nacimiento" / "Sala" / "Ingreso".
11. **Componente ParentsCard:** crear `app/_components/ninos/parents-card.tsx` — recibe `parents: LinkedParent[]`. Cada padre: `<Avatar size="sm">` + nombre + "roleLabel · statusLabel lower" + badge estado. Al final `<a href="#">Vincular otro padre</a>` con avatar dashed.
12. **Página Lista (container):** crear `app/ninos/page.tsx` — importa `mockChildren`, monta `<Sidebar activeItem="ninos">` (desktop) + `<TopBar>` (mobile) + main con header ("GESTIÓN" / "Niños" / botón "Agregar niño"), input buscar, sección "SALA SOLES · 8 niños", grid 2 col de `mockChildren.map(c => <KidCard key={c.id} child={c} />)`.
13. **Página Perfil (container):** crear `app/ninos/[id]/page.tsx` — usa `params.id` con `getChildById`. Si no existe, renderiza mensaje "Niño no encontrado" (sin throw). Monta `<Sidebar activeItem="ninos">` + main con "Volver a Niños" (href `/ninos`), grid 2 col: izquierda `ChildProfileHeader` + `AllergiesCard` (si `allergyNotes`) + `ChildDetails`; derecha botón "Resumen del día" + `ParentsCard`.
14. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/ninos` coincide visualmente con `reference/screenshots/ninos.png` y `/ninos/mateo` con `reference/screenshots/perfil-nino.png`.

## Acceptance criteria

- [ ] `app/ninos/page.tsx` renderiza la lista de niños en `/ninos`.
- [ ] `app/ninos/[id]/page.tsx` renderiza el perfil del niño en `/ninos/<id>` usando `params.id` para resolver el mock.
- [ ] El sidebar marca "Niños" como activo en `/ninos` y `/ninos/[id]`, y sigue marcando "Feed" activo en `/` (regresión nula).
- [ ] La página Lista muestra el header "GESTIÓN" + "Niños" + botón "Agregar niño".
- [ ] La página Lista muestra el input "Buscar niño…" (solo visual, sin handler).
- [ ] La página Lista muestra la sección "SALA SOLES · 8 niños" y un grid 2 columnas con exactamente 8 KidCards replicando nombres/edades del mockup.
- [ ] Cada KidCard muestra avatar (color + inicial), nombre (Fredoka), "edad años · N padres vinculados" o "sin padres vinculados", y slot derecho correcto: badge alérgeno (MANÍ/LACTOSA) si `allergens.length > 0`, badge VINCULAR si no tiene alérgenos y `linkedParents.length === 0`, chevron en caso contrario.
- [ ] La página Perfil muestra el link "Volver a Niños" apuntando a `/ninos`.
- [ ] La página Perfil muestra `ChildProfileHeader` con avatar 84px, nombre (Fredoka 28px), "edad · Sala X" y botón "Editar".
- [ ] La página Perfil muestra `AllergiesCard` (rosa, ícono warning, "Alergias y notas" + notas) solo si el niño tiene `allergyNotes`.
- [ ] La página Perfil muestra `ChildDetails` con filas "Fecha de nacimiento" / "Sala" / "Ingreso" y los valores del mock.
- [ ] La página Perfil muestra el botón "Resumen del día" (fondo `--color-text`) y debajo `ParentsCard`.
- [ ] `ParentsCard` lista cada padre con avatar + nombre + "roleLabel · statusLabel lower" + badge estado (ACTIVA verde / PENDIENTE amarillo) y el link "Vincular otro padre" al final.
- [ ] Todos los links a pantallas no implementadas ("Agregar niño", "Editar", "Resumen del día", "Vincular otro padre", badge VINCULAR) usan `href="#"`.
- [ ] `Avatar`, `KidCard`, `ChildProfileHeader`, `AllergiesCard`, `ChildDetails` y `ParentsCard` no importan `mock-children.ts`; reciben toda su data por props.
- [ ] `app/page.tsx` pasa `activeItem="feed"` al `<Sidebar />` y su UI visual no cambia respecto a SPEC 01.
- [ ] Los tokens nuevos en `app/globals.css` están definidos en `@theme inline` (no como estilos inline en JSX).
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola al cargar `/ninos` ni `/ninos/mateo`.

## Decisions

- **Sí:** Rutas `app/ninos/` + `app/ninos/[id]/`. Sigue App Router, permite deep-linking y deja el slug preparado para backend.
- **No:** Rutas planas `/perfil-nino/` o una sola página con estado. No escalan a N niños.
- **Sí:** Refactorizar `Sidebar` con prop `activeItem`. Un solo source of truth, evita duplicar 163 líneas por pantalla.
- **No:** Duplicar Sidebar en `_components/ninos/`. Acumularía duplicación con cada pantalla nueva.
- **Sí:** Componente `Avatar` en `_components/ui/` reutilizable. Se usa en KidCard (md) y ChildProfileHeader (lg); prepara el suelo para retroalimentar PostCard/Composer/Sidebar en otra spec.
- **No:** Dejar el avatar inline en cada componente. Duplica lógica en 3+ sitios.
- **No:** Retroalimentar PostCard/Composer/Sidebar para usar `Avatar` en esta spec. Toca SPEC 01 por fuera del alcance — se hace en una spec separada si se quiere.
- **Sí:** Mock en `app/_lib/mock-children.ts` + tipos en `app/_lib/child-types.ts`. Sigue el patrón `mock-posts.ts` + `post-types.ts` de SPEC 01.
- **No:** Hardcodear niños en el JSX. Iba contra el patrón presentational/container.
- **Sí:** Prioridad alérgeno > VINCULAR > chevron en el slot derecho del KidCard. La alergia es info de seguridad y prima; VINCULAR es acción pendiente pero menos urgente.
- **No:** Apilar ambos badges. El mockup no muestra ese caso y rompería el layout.
- **Sí:** Todos los links a pantallas no implementadas con `href="#"` (excepto "Volver a Niños" → `/ninos`). Consistente con SPEC 01; evita rutas 404 ahora.
- **No:** Rutas placeholder con páginas vacías. Crea páginas que luego se reescriben — trabajo duplicado.
- **Sí:** Input "Buscar niño…" solo visual sin handler. Consistente con "solo interfaces"; el filtro va con el backend.
- **No:** Filtro client-side con useState. Añade lógica fuera del alcance.
- **Sí:** TopBar mobile existente se reutiliza tal cual (botón "Nueva publicación"). En desktop el sidebar también tiene ese botón, así que es consistente.
- **No:** Crear TopBar específico para Niños. El botón "Agregar niño" vive en el main.
- **Sí:** Tokens nuevos para badges y alergias en `@theme inline`. Sigue el stack Tailwind v4 CSS-first de SPEC 01.
- **No:** Estilos inline del mockup. Ensucian el JSX y desactivan Tailwind.
- **Sí:** `getChildById` helper en el mock. Resolución limpia del perfil sin tocar el container con lógica de búsqueda.
- **No:** Throw on missing child. Una página simple "Niño no encontrado" mantiene la build estática sin errores 500.
- **Sí:** Patrón presentational/container como en SPEC 01. Todos los componentes nuevos reciben props; `page.tsx` es el único que conoce el mock.

## What is **not** in this spec

- Lógica de búsqueda real sobre el input "Buscar niño…".
- Backend, autenticación, persistencia o datos reales.
- Navegación real a pantallas referenciadas (Agregar niño, Vincular padre, Resumen del día, Editar niño, Avisos, Mi cuenta) — todas `href="#"`.
- Retroalimentar los componentes del feed (`PostCard`, `Composer`, `Sidebar`) para usar el nuevo `Avatar`.
- Clean/Hexagonal architecture completa — diferida a la spec de backend como en SPEC 01.
- Dark mode.
