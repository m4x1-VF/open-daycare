# SPEC 07 — Modal Crear Publicación

> **Estado:** Implementada
> **Depende de:** SPEC 01, SPEC 05
> **Fecha:** 2026-08-31
> **Objetivo:** Implementar la modal de crear publicación que se abre al pulsar el Composer, con selector de destinatario (niño o toda la sala), selector de tipo (7 tipos), textarea y fotos estáticas, que al publicar agrega el post al feed en memoria.

## Scope

**In:**

- Extender `PostType` en `app/_lib/post-types.ts` con 4 nuevos valores: `"meal"`, `"nap"`, `"encouragement"`, `"photo"`. Actualizar `POST_TYPE_LABELS` con las 7 entradas. Agregar `POST_TYPE_COLORS` (record de `PostType` → `{ bg, text }`) con los colores del mockup.
- Convertir `Composer` (`app/_components/feed/composer.tsx`) de `<a href="#">` a `<button>` con nueva prop `onClick: () => void`. Sigue siendo server component presentacional.
- Componente `CreatePostModal` (Client Component) en `app/_components/feed/create-post-modal.tsx` — overlay reutilizando `.modal-overlay` + `.modal-card` con `data-state` de SPEC 05. Card max-width 580px replicando el mockup: header ("Cancelar" + "Nueva publicación" + "Publicar"), sección PARA (pills de niños + "Toda la sala", selección múltiple de niños con toggle y exclusión mutua con "Toda la sala"), sección TIPO (7 pill buttons con colores), sección DESCRIPCIÓN (textarea), sección FOTOS (UI estática: placeholder de imagen + botón "Agregar" sin funcionalidad). Props: `open`, `onClose`, `onPublish: (post: FeedPost) => void`, `childList: Child[]`.
- Componente `NewPostButton` (Client Component) en `app/_components/feed/new-post-button.tsx` — reemplaza el `<a href="#">` muerto del sidebar por un `<button>` que dispara el custom event `open-create-post` en `window`. Exporta la constante `OPEN_CREATE_POST_EVENT`. `Sidebar` sigue siendo server component.
- `FeedSection` escucha `OPEN_CREATE_POST_EVENT` con un `useEffect` y abre la modal — así el botón del sidebar (renderizado fuera de `FeedSection`) también abre la modal.
- Componente `FeedSection` (Client Component) en `app/_components/feed/feed-section.tsx` — wrapper que recibe `initialPosts: FeedPost[]` y `childList: Child[]`, mantiene estado `posts` y `isModalOpen`. Renderiza `<Composer onClick={openModal} />` + `<CreatePostModal ...>` + la lista de `<PostCard>`.
- Actualizar `app/page.tsx`: extraer la zona de feed (Composer + lista de posts) a `<FeedSection initialPosts={mockPosts} />`. El header, Sidebar y TopBar quedan como Server Components.
- Validación inline: destinatario obligatorio, tipo obligatorio, descripción no vacía. "Publicar" deshabilitado hasta que los 3 estén completos. Fotos es opcional (sin funcionalidad).
- Al publicar: genera un único `FeedPost` con los datos del form y lo agrega al inicio del array de posts. Con varios niños seleccionados, un solo post combinado (ver Data model). Cierra la modal y resetea el form.
- Persistencia solo en memoria: al refrescar, los posts creados se pierden.

**Out of scope (para specs futuras):**

- Upload real de fotos (input file, preview, storage).
- Persistencia a base de datos o localStorage.
- Edición o eliminación de publicaciones.
- Reacciones (hearts) o comentarios en el post recién creado.
- Validación de longitud de texto.
- Trap focus dentro de la modal.
- Modo oscuro / dark mode.

## Data model

`PostType` se extiende:

```ts
export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "encouragement"
  | "photo"
  | "announcement";
```

`POST_TYPE_LABELS` se actualiza:

```ts
export const POST_TYPE_LABELS: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  encouragement: "Ánimo",
  photo: "Foto",
  announcement: "Anuncio",
};
```

Nuevo `POST_TYPE_COLORS`:

```ts
export const POST_TYPE_COLORS: Record<PostType, { bg: string; text: string }> = {
  meal:          { bg: "#9A7B1E", text: "#FFFFFF" },
  nap:           { bg: "#E7DCF6", text: "#7B5FC0" },
  activity:      { bg: "#2E89A6", text: "#FFFFFF" },
  achievement:   { bg: "#CFEBD8", text: "#3E9B6C" },
  encouragement: { bg: "#F9D2DE", text: "#C56486" },
  photo:         { bg: "#FBD8CC", text: "#D9684A" },
  announcement:  { bg: "#CCD8F4", text: "#4E72C8" },
};
```

Nuevo tipo para destinatarios:

```ts
export type Recipient =
  | { kind: "children"; childIds: string[] }
  | { kind: "room"; label: string };
```

Reglas de selección en PARA:

- Click en un niño lo agrega a la selección; click de nuevo lo quita (toggle). Con la selección vacía vuelve a `null` (form inválido).
- Click en "Toda la sala" selecciona la sala y desactiva todos los niños seleccionados (exclusión mutua).
- Click en un niño mientras "Toda la sala" está activa desactiva la sala y selecciona solo ese niño.
- Click en "Toda la sala" estando ya activa la deselecciona (toggle).

El `FeedPost` nuevo generado al publicar (un único post combinado):

```ts
if (recipient.kind === "room") {
  authorName = "Anuncio general";
  authorInitial = "";
  authorAvatarBg = "#CCD8F4";
  authorAvatarColor = "#4E72C8";
  recipientLabel = "toda la sala";
} else {
  const names = selectedChildren.map((c) => c.name.split(" ")[0]);
  recipientLabel = names.length === 1
    ? `familia de ${names[0]}`
    : `familias de ${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  authorName = names[0];
  authorInitial = selectedChildren[0].initial;
  authorAvatarBg = selectedChildren[0].avatarBg;
  authorAvatarColor = selectedChildren[0].avatarColor;
}
// timeLabel: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
// postedByLabel: "publicado por vos", type: selectedType, text: description, hearts: 0, comments: 0
```

## Implementation plan

1. **Extender `post-types.ts`:** agregar los 4 nuevos valores a `PostType`, actualizar `POST_TYPE_LABELS`, agregar `POST_TYPE_COLORS` y el tipo `Recipient`. Exportar todo.

2. **Tokens CSS:** en `app/globals.css` agregar a `@theme inline` los tokens de los nuevos tipos de post: `--color-tag-meal-bg` (`#9A7B1E`), `--color-tag-meal` (`#FFFFFF`), `--color-tag-nap-bg` (`#E7DCF6`), `--color-tag-nap` (`#7B5FC0`), `--color-tag-encouragement-bg` (`#F9D2DE`), `--color-tag-encouragement` (`#C56486`), `--color-tag-photo-bg` (`#FBD8CC`), `--color-tag-photo` (`#D9684A`).

3. **Actualizar Composer:** cambiar `<a href="#">` por `<button type="button" onClick={onClick}>` con nueva prop `onClick: () => void`. Mantener todo lo demás como server component presentacional.

4. **Componente CreatePostModal:** crear `app/_components/feed/create-post-modal.tsx` como Client Component. Props: `open`, `onClose`, `onPublish: (post: FeedPost) => void`, `childList: Child[]`. Overlay fijo reutilizando `.modal-overlay` + `.modal-card` de SPEC 05. Header con Cancelar/Publicar. Sección PARA: map de children como pills con avatar (initial + bg/color) + pill "Toda la sala", toggle de selección única. Sección TIPO: 7 pills con colores de `POST_TYPE_COLORS`, toggle de selección única. Sección DESCRIPCIÓN: textarea. Sección FOTOS: UI estática (placeholder de imagen + botón "Agregar" sin funcionalidad). Validación inline: destinatario + tipo + descripción obligatorios. Publicar deshabilitado hasta válido. Escape cierra, click fuera cierra, body scroll lock, auto-focus en textarea, `prefers-reduced-motion`. Al publicar: genera `FeedPost`, llama `onPublish`, resetea form, cierra modal.

5. **Componente FeedSection:** crear `app/_components/feed/feed-section.tsx` como Client Component. Props: `initialPosts: FeedPost[]`, `childList: Child[]`. Estado: `posts` (inicializado con `initialPosts`), `isModalOpen`. Renderiza `<Composer onClick={openModal} />` + `<CreatePostModal ...>` + sección "PUBLICADO HOY" + lista de `<PostCard>`. `handlePublish`: crea post y lo agrega al inicio de `posts` con `setPosts(prev => [newPost, ...prev])`.

6. **Actualizar `page.tsx`:** reemplazar `<Composer />` y el bloque de lista de posts por `<FeedSection initialPosts={mockPosts} childList={mockChildren} />`. Importar `mockChildren`. El header, Sidebar y TopBar quedan como Server Components.

7. **Verificación:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/` muestra el feed; click en Composer abre la modal; seleccionar destinatario + tipo + descripción y publicar agrega el post arriba del feed; cancelar cierra sin cambios; al refrescar los posts creados se pierden.

## Acceptance criteria

- [x] Click en el Composer abre la modal de crear publicación sin cambiar la URL.
- [x] Click en el botón "Nueva publicación" del sidebar abre la misma modal (custom event `open-create-post`).
- [x] La modal muestra header "Cancelar" (izq) + "Nueva publicación" (centro) + "Publicar" (der, deshabilitado inicialmente).
- [x] La sección PARA muestra un pill por cada niño de `mockChildren` (con avatar circular: initial + colores) y un pill "Toda la sala".
- [x] Click en un niño del PARA lo marca visualmente (fondo oscuro, texto blanco); click de nuevo lo deselecciona (toggle).
- [x] Se pueden seleccionar varios niños a la vez; cada uno mantiene su estado activo.
- [x] Seleccionar "Toda la sala" desactiva todos los niños seleccionados.
- [x] Seleccionar un niño mientras "Toda la sala" está activa desactiva la sala y deja solo ese niño.
- [x] La sección TIPO muestra los 7 pill buttons: Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio — cada uno con sus colores del mockup.
- [x] Seleccionar un tipo lo marca visualmente y deselecciona los demás. Solo uno activo a la vez.
- [x] La sección DESCRIPCIÓN muestra un textarea con placeholder "Contá cómo le fue hoy…".
- [x] La sección FOTOS muestra un placeholder de imagen y un botón "Agregar" (UI estática, sin funcionalidad).
- [x] El botón "Publicar" permanece deshabilitado mientras no haya destinatario, tipo y descripción seleccionados.
- [x] Descripción vacía (solo whitespace) mantiene "Publicar" deshabilitado.
- [x] Al pulsar "Publicar" con todos los campos válidos, el post nuevo aparece arriba de la lista en el feed.
- [x] El post nuevo muestra el avatar del primer niño seleccionado (o el avatar de anuncio si es "Toda la sala"), el texto, y el tipo correcto.
- [x] Con varios niños seleccionados, se genera un único post combinado: "Para: familias de Mateo y Sofía" (con "y" antes del último nombre).
- [x] Después de publicar, la modal se cierra y el form se resetea (sin selección de destinatario, tipo, ni texto).
- [x] Click en "Cancelar" cierra la modal sin agregar nada y resetea el form.
- [x] Click en el overlay cierra la modal.
- [x] Escape cierra la modal.
- [x] El body no hace scroll cuando la modal está abierta.
- [x] La modal muestra animación de entrada (scale + opacity ~200ms) y salida (~150ms).
- [x] Con `prefers-reduced-motion: reduce`, las animaciones de escala se eliminan.
- [x] Auto-focus en el textarea al abrir la modal.
- [x] Al refrescar la página, los posts creados se pierden (solo viven en memoria).
- [x] Los 3 posts del mock original siguen apareciendo sin cambios al cargar.
- [x] `Composer` sigue siendo server component presentacional y recibe `onClick` por props.
- [x] `CreatePostModal` y `FeedSection` son Client Components (`"use client"`).
- [x] `CreatePostModal` no importa `mock-children.ts` ni `mock-posts.ts`; recibe datos por callbacks/props.
- [x] `FeedSection` recibe `initialPosts` y `childList` por props.
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [x] `npm run dev` no registra errores en consola.
- [x] Todos los acceptance criteria de SPEC 01 y SPEC 05 siguen pasando (regresión).

## Decisions

- **Sí:** Cablear el botón "Nueva publicación" del sidebar vía custom event `open-create-post` (agregado durante implementación a pedido del usuario).
  - **Por qué:** El botón del sidebar es el CTA principal visualmente y quedó muerto fuera del scope original. La modal vive en `FeedSection` y el `Sidebar` es server component hermano, así que un custom event en `window` conecta ambos sin convertir `page.tsx` en client component ni introducir un context provider para un solo caso.

- **Sí:** Renombrar la prop `children` a `childList` en `CreatePostModal` y `FeedSection` (durante implementación).
  - **Por qué:** `react/no-children-prop` está activo en el lint del repo y `children` pisa la prop reservada de React. El renombre es la convención correcta y evita fragilidad si algún día se le pasa contenido anidado a la modal.

- **Sí:** Un solo `POST_TYPE_LABELS` en title case + clase `uppercase` en el tag de `PostCard` (durante implementación).
  - **Por qué:** El mockup de la modal muestra los tipos en title case ("Comida") y el feed los muestra uppercase ("LOGRO"). Un solo constant + CSS `uppercase` mantiene una única fuente de verdad y el feed visualmente idéntico.

- **Sí:** Extender `PostType` con 7 valores en lugar de crear un tipo separado.
  - **Por qué:** El feed puede mostrar cualquier tipo de post. Tener un solo tipo canónico evita duplicación y hace que `PostCard` acepte los nuevos tipos sin cambios.

- **Sí:** Selección múltiple de niños en PARA, con exclusión mutua contra "Toda la sala" (modificado durante implementación a pedido del usuario; reemplaza la selección única del spec original).
  - **Por qué:** El usuario necesita publicar para varios niños a la vez. "Toda la sala" limpia la selección de niños y viceversa — seleccionar la sala ya incluye a todos, y mezclar ambos destinos sería ambiguo.

- **Sí:** Un único post combinado al publicar con varios niños, mostrando el avatar del primer niño y "familias de X y Y" (decisión del usuario entre dos opciones).
  - **Por qué:** Evita duplicar cards en el feed y no requiere rediseñar `PostCard`. El primer niño aporta el avatar porque el modelo `FeedPost` solo soporta un autor por post; el `recipientLabel` comunica el grupo completo.

- **Sí:** "Toda la sala" es mutuamente excluyente con los niños individuales.
  - **Por qué:** Publicar "a toda la sala" ya incluye a todos. Seleccionar además un niño individual sería redundante.

- **Sí:** Fotos como UI estática sin funcionalidad.
  - **Por qué:** El upload real requiere backend/storage. La UI estática ya valida el layout visual y se completa en otra spec.

- **Sí:** `FeedSection` como Client Component wrapper, `Composer` sigue siendo server component presentacional.
  - **Por qué:** Consistente con el patrón container/presentational de specs anteriores (ParentsSection/ParentsCard). El wrapper maneja estado; los presentacionales solo renderizan.

- **Sí:** Composer cambia de `<a>` a `<button>`.
  - **Por qué:** Semánticamente es una acción (abrir modal), no navegación. Consistente con el cambio de ParentsCard en SPEC 06.

- **Sí:** Publicar agrega al feed en memoria.
  - **Por qué:** Da feedback visual real al usuario. Sin backend es la única forma de demostrar el flujo completo.

- **Sí:** El post nuevo se agrega al inicio del array.
  - **Por qué:** Lo más reciente va arriba. Consistente con cualquier feed cronológico.

- **No:** Upload real de fotos.
  - **Por qué:** Fuera del alcance. Requiere backend + storage. Mérito de spec propia.

- **No:** Usar Framer Motion.
  - **Por qué:** CSS transitions son suficientes, más performantes, menos bundle. Consistente con SPEC 05.

- **No:** Trap focus (Tab cycling).
  - **Por qué:** Over-engineering para una modal con pocos elementos. Consistente con decisión de SPEC 05 y 06.

## Risks

| Risk | Mitigation |
|------|-----------|
| `page.tsx` necesita pasar datos de niños a `FeedSection` | Importar `mockChildren` en `page.tsx` y pasar por props. Simple, sin side effects. |
| Los colores de tipo como inline style en pills pueden no seguir convenciones de tokens | Usar los tokens CSS nuevos + inline style para los colores específicos (bg y text) como hace el mockup. Los tokens sirven como referencia pero los pills necesitan colores arbitrarios. |
| `PostCard` puede necesitar cambios si no reconoce los nuevos `PostType` | Verificar que `PostCard` usa `POST_TYPE_LABELS` y no un switch hardcodeado. Si tiene switch, agregar los 4 casos nuevos. |

## What is **not** in este spec

- Upload real de fotos (input file, preview, storage).
- Persistencia a base de datos o localStorage.
- Edición o eliminación de publicaciones.
- Reacciones (hearts) o comentarios en el post recién creado.
- Validación de longitud de texto.
- Trap focus dentro de la modal.
- Modo oscuro / dark mode.

Cada una de esas, si se implementa, va en su propia spec.
