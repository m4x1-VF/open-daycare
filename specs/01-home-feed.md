# SPEC 01 — Home: feed de la guardería

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-08-11
> **Objetivo:** Construir la pantalla de Home como feed de publicaciones de la guardería, replicando el diseño de `reference/pantallas/feed.dc.html` (solo UI, sin lógica de negocio).

## Scope

**In:**

- Página Home en `app/page.tsx` que reemplaza el starter de create-next-app.
- Layout de dos columnas: sidebar fija a la izquierda + main con scroll.
- Sidebar con: logo OpenDaycare + sala "Soles", botón "Nueva publicación", navegación (Feed activo, Niños, Avisos, Mi cuenta), tarjeta de usuario (Caro Giménez · Maestra) y logout.
- Encabezado "Buenas, Caro" con subtítulo "12 niños · martes 17 jun".
- Composer ("Compartí un momento…") sobre la lista de posts.
- Lista de 3 posts con los tipos LOGRO, ACTIVIDAD (con placeholder de foto) y ANUNCIO; cada uno con autor (avatar + nombre + hora), destinatario, texto, y footer con corazones / comentarios / Editar.
- Separación presentational/container: `PostCard`, `Sidebar`, `Composer` y `TopBar` son presentacionales (reciben props, sin lógica de fetching); `app/page.tsx` actúa como container que les inyecta `mockPosts` y otros props.
- Top bar responsiva para mobile (<768px) que reemplaza el sidebar.
- Sistema de tokens de color y tipografía en `app/globals.css` y `app/layout.tsx`.

**Out of scope (para specs futuras):**

- Lógica de publicación/edición, contador de reacciones real y navegación real a otras pantallas (todos los links son `href="#"`).
- Backend, autenticación y datos persistentes.
- Las pantallas Niños, Avisos, Mi cuenta, crear-publicación, detalle-publicación, foto y login.
- Dark mode.

## Data model

Esta spec **no introduce datos persistentes**. El contenido del feed es un mock estático tipado en código:

```ts
// app/_lib/mock-posts.ts
export type PostType = "achievement" | "activity" | "announcement";

export interface FeedPost {
  id: string;
  authorName: string;
  authorInitial: string;
  authorAvatarBg: string;
  authorAvatarColor: string;
  timeLabel: string;
  postedByLabel: string;
  recipientLabel: string;
  type: PostType;
  text: string;
  photoLabel?: string;
  hearts: number;
  comments: number;
}

// UI labels in Spanish, mapped from the English type identifiers.
export const POST_TYPE_LABELS: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};
```

El mock exporta exactamente 3 items replicando el contenido de `feed.dc.html` (logro de Mateo, actividad con foto de Mateo, anuncio general). Los valores del `type` van en inglés (`achievement` / `activity` / `announcement`); los chips visuales muestran el label en español vía `POST_TYPE_LABELS`.

## Implementation plan

1. **Tipografías:** en `app/layout.tsx` cargar `Fredoka` y `Nunito` vía `next/font/google` con vars `--font-fredoka` / `--font-nunito`; el body usa Nunito por defecto. Actualizar `metadata.title` a "OpenDaycare".
2. **Tokens de diseño:** en `app/globals.css` añadir la paleta cálida (crema `#F6ECDF`, coral `#F2937A` / `#EE8164` / `#F4977E`, tarjetas `#FFFDF9`, bordes `#ECE0D0` / `#F0E6D8`, texto `#3F362E` / `#4A4038` / `#94887B` / `#A89A8B`, tags logro `#CFEBD8`/`#3E9B6C`, actividad `#C7E7F1`/`#2E89A6`, anuncio `#CCD8F4`/`#4E72C8`) como vars en `@theme inline`. Quitar el dark scheme del starter.
3. **Mock data:** crear `app/_lib/mock-posts.ts` con el tipo `FeedPost` y el array `mockPosts` (3 items del mockup). Este es el único módulo que contiene datos; los componentes presentacionales no lo importan.
4. **Componente Sidebar (presentacional):** crear `app/_components/feed/sidebar.tsx`. Recibe props (usuario, sala) o usa defaults literales internos. No importa `mock-posts.ts`. Todos `href="#"`.
5. **Componente Composer (presentacional):** crear `app/_components/feed/composer.tsx` (avatar "C", "Compartí un momento…", ícono de cámara). `href="#"`. Sin imports de data externa.
6. **Componente PostCard (presentacional):** crear `app/_components/feed/post-card.tsx` (header con avatar + nombre + chip de tipo, destinatario, texto, bloque de foto opcional, footer con corazones / comentarios / Editar). Recibe `post: FeedPost` por props. Sin handlers. No importa `mock-posts.ts`.
7. **Componente TopBar (presentacional):** crear `app/_components/feed/top-bar.tsx` (logo compacto + botón "Nueva publicación" + avatar) visible solo en `< md`. Sin imports de data externa.
8. **Página Home (container):** en `app/page.tsx` importar `mockPosts` y montar `Sidebar` (desktop) + `TopBar` (mobile) + main con encabezado, `Composer` y `mockPosts.map((p) => <PostCard key=... post={p} />)`. El container es el único que conoce el origen de la data.
9. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/` coincide visualmente con `reference/screenshots/feed.png` en desktop y reordena en `<768px`.

## Acceptance criteria

- [ ] `app/page.tsx` reemplaza el starter y renderiza el feed en `/`.
- [ ] El sidebar muestra "OpenDaycare · Sala Soles", el botón naranja "Nueva publicación" y los 4 items de navegación, con Feed marcado como activo.
- [ ] El sidebar termina con la tarjeta "Caro Giménez · Maestra · Soles" y el botón de logout.
- [ ] El encabezado del main dice "Buenas, Caro" con subtítulo "12 niños · martes 17 jun".
- [ ] El composer "Compartí un momento…" aparece entre el encabezado y la lista de posts.
- [ ] Se renderizan exactamente 3 PostCards replicando los textos de `feed.dc.html` (logro del orinal, actividad de témperas con placeholder de foto, anuncio del parque).
- [ ] Cada PostCard muestra el chip de tipo con label en español (`LOGRO`, `ACTIVIDAD`, `ANUNCIO`) y color correcto (verde / celeste / lila según `type` sea `achievement` / `activity` / `announcement`), y el número visible de hearts y comentarios del mock.
- [ ] En viewport `<768px` el sidebar desaparece y aparece la TopBar con el botón "Nueva publicación" y el avatar.
- [ ] La tipografía usa Fredoka para títulos/avatares y Nunito para texto de cuerpo, cargadas vía `next/font/google` (sin `<link>` a Google Fonts).
- [ ] Los colores siguen la paleta cálida de `feed.dc.html` definida como tokens en `app/globals.css` (no colores del starter).
- [ ] Todos los links a pantallas no implementadas usan `href="#"` (ninguna ruta nueva en `app/`).
- [ ] `PostCard`, `Sidebar`, `Composer` y `TopBar` no importan `mock-posts.ts` ni acceden a estado externo; reciben toda su data por props o la definen como literales internos.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores.
- [ ] `npm run dev` no registra errores en consola al cargar `/`.

## Decisions

- **Sí:** Componentes separados bajo `app/_components/feed/`. Reutilizables cuando lleguen Niños/Avisos.
- **No:** Todo inline en `page.tsx`. Duplicaría el sidebar en cada pantalla futura.
- **Sí:** Paleta cálida como tokens CSS en `@theme inline` + utilidades Tailwind. Sigue el stack del proyecto (Tailwind v4 CSS-first).
- **No:** Replicar los `style="..."` inline del mockup. Ensucia el JSX y desactiva Tailwind.
- **Sí:** Agregar Fredoka + Nunito vía `next/font/google`. Son parte del diseño del mockup.
- **No:** Mantener solo Geist. Tipografía distinta al mockup.
- **Sí:** Links a pantallas inexistentes con `href="#"`. Evita rutas 404 mientras no se implementan.
- **No:** Rutas reales (`/ninos`, etc.). Tendríamos que tocar cada link cuando lleguen sus pantallas.
- **Sí:** Mock tipado en `app/_lib/mock-posts.ts`. Limpio para sustituir por backend. Cuando exista backend, el mock se reemplaza por un repositorio inyectado al container — la estructura real (Clean/Clean+hexagonal/otra) se define en esa spec.
- **No:** Hardcodear los posts en el JSX.
- **Sí:** Todo estático, sin handlers. La spec es solo de diseño.
- **No:** Toggle de corazón. El mockup siempre lo muestra lleno; simular estado falsearía el diseño.
- **Sí:** TopBar responsiva para mobile. Uso real en celular.
- **No:** Replicar desktop-only. Inusable en mobile.
- **Sí:** Quitar dark mode del starter. El mockup no lo define.
- **Sí:** Patrón presentational/container. `PostCard`/`Sidebar`/`Composer`/`TopBar` reciben props y no saben de dónde viene la data; `page.tsx` es el container que inyecta el mock. Aisla la UI del origen de datos y deja la puerta abierta a un repositorio real sin tocar los componentes.
- **No:** Clean Architecture completa (domain/use-cases/infrastructure/adapters). Esta spec es solo presentación con mock estático: no hay lógica de negocio que aislar. Estructurar carpetas ahora copiaría la forma sin el contenido y obligaría a reorganizar cuando llegue el backend. Se evaluará en la spec del backend/autenticación.

## What is **not** in this spec

- Lógica de publicación, edición o reacciones reales (corazón / comentarios / Editar solo se muestran).
- Navegación funcional a Niños, Avisos, Mi cuenta, crear-publicación, detalle-publicación, foto, login.
- Estructura Clean/Hexagonal completa — diferida a la spec del backend/autenticación, cuando exista lógica de negocio que aislar.
- Backend, autenticación o datos persistentes.
- Las pantallas referenciadas desde el sidebar y los posts.
- Dark mode.