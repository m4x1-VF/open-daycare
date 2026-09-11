# SPEC 09 — Tablas rooms y children + persistencia de Agregar niño

> **Estado:** Aprobado
> **Depende de:** SPEC DB 01, SPEC DB 02, SPEC 04
> **Fecha:** 2026-09-11
> **Objetivo:** Crear las tablas `rooms` y `children` en Supabase con RLS filtrado por daycare, poblar 3 salas por defecto (Soles, Terra, Luna), y conectar la modal de Agregar niño (SPEC 04) para persistir niños reales — reemplazando los datos en memoria por lecturas y escrituras a la base de datos.

## Scope

**In:**

- Migración SQL aplicada directo al proyecto remoto vía MCP (`supabase_apply_migration`).
- Enum `child_status` (`active`, `archived`).
- Tabla `rooms` con columnas: `id uuid PK`, `daycare_id uuid FK → daycares`, `name text NOT NULL`, `created_at timestamptz`, `updated_at timestamptz`.
- Tabla `children` con todas las columnas del schema de DB (ver Data model).
- Triggers `set_rooms_updated_at` y `set_children_updated_at` invocando `set_updated_at()` (de SPEC DB 01).
- RLS en ambas tablas: políticas SELECT filtradas por daycare del usuario autenticado (vía `private.get_user_daycare_id()`). Política INSERT en `children` que verifica que la room pertenezca al mismo daycare del usuario.
- Seed de 3 rooms: `"Soles"`, `"Terra"`, `"Luna"` — todas vinculadas a `"Guardería Sala Soles"`.
- Tabla `children` arranca vacía — sin seed de niños.
- Server Action `addChild` en `app/(main)/ninos/actions.ts` que inserta en `children` y devuelve la fila creada.
- Actualizar `app/ninos/page.tsx` para leer rooms y children de Supabase como Server Component y pasarlos por props a `NinosManager`.
- Actualizar `NinosManager` para recibir `rooms` como prop, agrupar niños por sala con headers, y persistir vía Server Action al guardar.
- Actualizar `AddChildModal` para que el dropdown de sala use `room.id` como valor y llame al Server Action vía callback asíncrono.
- Nuevo tipo `DbChild` y `DbRoom` en `app/_lib/db-types.ts` que reflejan las filas de las tablas.
- Función `mapDbChildToChild()` en `app/_lib/child-helpers.ts` para convertir `DbChild` + `roomName` → `Child` (tipo UI de SPEC 02).
- Eliminar el uso de `mockChildren` en `/ninos` — la lista arranca vacía, los niños se crean vía modal y persisten en DB.

**Out of scope (para specs futuras):**

- Edición o eliminación de niños.
- Perfil del niño (`/ninos/[id]`).
- Vinculación de padres a niños (`parent_children`).
- Políticas de UPDATE/DELETE en `rooms` o `children`.
- UI para gestionar rooms (crear, editar, eliminar salas).
- Búsqueda/filtro real de niños.
- Upload de foto/avatar del niño.
- Validación de duplicados (dos niños con el mismo nombre).
- Mostrar rooms vacías en el listado de `/ninos`.
- Migraciones locales con Supabase CLI.

## Data model

### SQL

```sql
CREATE TYPE child_status AS ENUM ('active', 'archived');

CREATE TABLE rooms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid        NOT NULL REFERENCES daycares(id),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE children (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid           NOT NULL REFERENCES rooms(id),
  full_name     text           NOT NULL,
  birth_date    date           NOT NULL,
  enrolled_at   date           NOT NULL DEFAULT CURRENT_DATE,
  medical_notes text,
  allergy_tags  text[]         NOT NULL DEFAULT '{}',
  photo_consent boolean        NOT NULL DEFAULT true,
  status        child_status   NOT NULL DEFAULT 'active',
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY rooms_read
  ON rooms FOR SELECT TO authenticated
  USING (daycare_id = (SELECT private.get_user_daycare_id()));

CREATE POLICY children_read
  ON children FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

CREATE POLICY children_insert
  ON children FOR INSERT TO authenticated
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM rooms r
      WHERE r.daycare_id = (SELECT private.get_user_daycare_id())
    )
  );

INSERT INTO rooms (daycare_id, name)
SELECT id, name FROM (VALUES
  ('Soles'),
  ('Terra'),
  ('Luna')
) AS v(name)
CROSS JOIN (
  SELECT id FROM daycares WHERE name = 'Guardería Sala Soles'
) AS d;
```

### TypeScript — tipos DB

Nuevo archivo `app/_lib/db-types.ts`:

```ts
export interface DbRoom {
  id: string;
  daycare_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbChild {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}
```

### TypeScript — función de mapeo

Nueva exportación en `app/_lib/child-helpers.ts`:

```ts
import { Child } from "@/app/_lib/child-types";
import { DbChild } from "@/app/_lib/db-types";
import { AVATAR_POOL } from "@/app/_lib/child-helpers";

export function mapDbChildToChild(
  row: DbChild,
  roomName: string,
  index: number
): Child {
  const birth = new Date(row.birth_date);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const birthdateLabel = `${birth.getDate()} ${months[birth.getMonth()]} ${birth.getFullYear()}`;

  const enrolled = new Date(row.enrolled_at);
  const admissionLabel = `${months[enrolled.getMonth()]} ${enrolled.getFullYear()}`;

  const avatar = AVATAR_POOL[index % AVATAR_POOL.length];

  return {
    id: row.id,
    name: row.full_name,
    initial: row.full_name[0].toUpperCase(),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    ageYears: age,
    birthdateLabel,
    room: roomName,
    admissionLabel,
    allergens: row.allergy_tags.map((t) => t.toUpperCase()),
    allergyNotes: row.medical_notes ?? undefined,
    linkedParents: [],
  };
}
```

### Server Action — `addChild`

```ts
"use server";

import { createClient } from "@/utils/supabase/server";

interface AddChildInput {
  full_name: string;
  birth_date: string;
  room_id: string;
  allergy_tags: string[];
  medical_notes?: string;
}

export async function addChild(input: AddChildInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .insert({
      full_name: input.full_name,
      birth_date: input.birth_date,
      room_id: input.room_id,
      allergy_tags: input.allergy_tags,
      medical_notes: input.medical_notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### AddChildModal — cambio en el dropdown

El `<select>` pasa de `value={room}` (string de nombre) a `value={roomId}` (UUID):

```tsx
{rooms.map((r) => (
  <option key={r.id} value={r.id}>
    {r.name}
  </option>
))}
```

El callback `onSave` se vuelve asíncrono y recibe datos del form en lugar de un `Child` construido:

```ts
interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    birth_date: string;
    room_id: string;
    allergy_tags: string[];
    medical_notes?: string;
  }) => Promise<void>;
  rooms: { id: string; name: string }[];
}
```

### NinosManager — flujo de guardado

```ts
async function handleSaveChild(data: AddChildInput) {
  setIsSaving(true);
  try {
    const dbChild = await addChild(data);
    const room = rooms.find((r) => r.id === dbChild.room_id);
    const roomName = room?.name ?? "";
    const uiChild = mapDbChildToChild(dbChild, roomName, children.length);
    setChildren((prev) => [...prev, uiChild]);
    setIsModalOpen(false);
  } catch (error) {
    console.error("Failed to add child:", error);
  } finally {
    setIsSaving(false);
  }
}
```

### NinosManager — agrupación por sala

Reemplaza la sección hardcoded "SALA SOLES" por un loop sobre rooms con niños:

```tsx
{rooms
  .map((room) => ({
    room,
    kids: children.filter((c) => c.room === room.name),
  }))
  .filter(({ kids }) => kids.length > 0)
  .map(({ room, kids }) => (
    <div key={room.id} className="mb-[22px]">
      <div className="flex items-center gap-3 mb-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-text">
          SALA {room.name.toUpperCase()}
        </span>
        <span className="text-[13px] text-text-faint">
          {kids.length} {kids.length === 1 ? "niño" : "niños"}
        </span>
        <span className="flex-1 h-px bg-section-line" />
      </div>
      <div className="grid grid-cols-2 gap-[14px]">
        {kids.map((child) => (
          <KidCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  ))}
```

## Implementation plan

1. **Aplicar migración `create_rooms_and_children`** vía `supabase_apply_migration` — contiene en orden: (a) enum `child_status`, (b) tabla `rooms`, (c) tabla `children`, (d) triggers, (e) RLS + políticas, (f) seed de 3 rooms.

2. **Verificar esquema** con `supabase_list_tables` (verbose) — confirmar columnas, tipos y FKs de `rooms` y `children`.

3. **Verificar enum** con `supabase_execute_sql` — `SELECT enum_range(NULL::child_status)` devuelve `{active,archived}`.

4. **Verificar seed** con `supabase_execute_sql` — `SELECT r.name, d.name AS daycare FROM rooms r JOIN daycares d ON r.daycare_id = d.id ORDER BY r.created_at` devuelve 3 filas: Soles, Terra, Luna → Guardería Sala Soles.

5. **Verificar tabla vacía** con `supabase_execute_sql` — `SELECT count(*) FROM children` devuelve 0.

6. **Verificar RLS** con `supabase_get_advisors` (security) — sin warnings de RLS faltante para `rooms` ni `children`.

7. **Tipos DB:** crear `app/_lib/db-types.ts` con `DbRoom` y `DbChild`.

8. **Función de mapeo:** agregar `mapDbChildToChild()` a `app/_lib/child-helpers.ts`. Importa `DbChild` de `db-types.ts` y `Child` de `child-types.ts`. Usa `AVATAR_POOL` (ya existente) para colores rotativos.

9. **Server Action:** crear `app/(main)/ninos/actions.ts` con `addChild(input)` — `'use server'`, usa `createClient` de `@/utils/supabase/server`, inserta en `children`, devuelve la fila con `.select().single()`.

10. **Actualizar `AddChildModal`:** cambiar props de `onSave: (child: Child) => void` a `onSave: (data) => Promise<void>`. Agregar prop `rooms: { id: string; name: string }[]`. Eliminar import de `ROOMS` de `@/app/_lib/rooms`. El `<select>` usa `room.id` como `value` y `room.name` como label. Agregar estado `isSaving`; botón "Guardar" disabled mientras `isSaving` es `true`. La función interna `handleSave` convierte la fecha `dd/mm/aaaa` a `yyyy-mm-dd` para la DB y construye el objeto `AddChildInput`.

11. **Actualizar `NinosManager`:** agregar prop `rooms: { id: string; name: string }[]`. Pasar `rooms` a `AddChildModal`. Cambiar `handleSaveChild` a asíncrono: llama `addChild()` del Server Action, recibe `DbChild`, mapea a `Child` con `mapDbChildToChild()`, agrega al estado. Agregar estado `isSaving`. Reemplazar sección hardcoded "SALA SOLES" por agrupación dinámica por sala (ver Data model).

12. **Actualizar `app/ninos/page.tsx`:** agregar queries a Supabase (`createClient` de server). Fetch rooms: `supabase.from("rooms").select("*").order("created_at")`. Fetch children: `supabase.from("children").select("*").eq("status", "active").order("full_name")`. Mapear children a UI usando `mapDbChildToChild()` con el nombre de room resuelto. Pasar `rooms` y children mapeados a `<NinosManager>`. Eliminar import de `mockChildren`.

13. **Verificación final:** `npm run lint` y `npx tsc --noEmit` pasan; `npm run dev` en `/ninos` muestra la lista vacía con los headers de sala; click en "Agregar niño" abre la modal; el dropdown muestra Soles, Terra, Luna; llenar form y guardar persiste en DB y el niño aparece en la sala correspondiente; refresh mantiene los niños; cancelar cierra sin cambios.

## Acceptance criteria

- [x] La migración `create_rooms_and_children` se aplicó sin errores en Supabase.
- [x] El enum `child_status` existe con valores `active` y `archived`.
- [x] La tabla `rooms` existe con las 5 columnas correctas (`id` uuid PK, `daycare_id` uuid FK, `name` text NOT NULL, `created_at` timestamptz, `updated_at` timestamptz).
- [x] La tabla `children` existe con las 11 columnas correctas según el schema de DB.
- [x] `children.room_id` tiene FK a `rooms(id)`.
- [x] `children.status` es de tipo `child_status` con default `'active'`.
- [x] `children.allergy_tags` es `text[]` con default `'{}'`.
- [x] `children.photo_consent` es `boolean` con default `true`.
- [x] `children.enrolled_at` es `date` con default `CURRENT_DATE`.
- [x] Los triggers `set_rooms_updated_at` y `set_children_updated_at` existen y actualizan `updated_at` en UPDATE.
- [x] RLS está habilitado en `rooms` y `children`.
- [x] La política `rooms_read` permite SELECT a usuarios autenticados del mismo daycare.
- [x] La política `children_read` permite SELECT a usuarios autenticados cuyos niños pertenezcan a rooms de su daycare.
- [x] La política `children_insert` permite INSERT a usuarios autenticados solo si el `room_id` pertenece a una room de su daycare.
- [x] La tabla `rooms` contiene 3 filas: Soles, Terra, Luna — todas con `daycare_id` apuntando a "Guardería Sala Soles".
- [x] La tabla `children` está vacía (0 filas).
- [x] `supabase_get_advisors` (security) no reporta warnings de RLS faltante para `rooms` ni `children`.
- [x] `app/_lib/db-types.ts` exporta `DbRoom` y `DbChild` que reflejan las columnas de las tablas.
- [x] `mapDbChildToChild()` convierte correctamente `DbChild` + `roomName` + `index` → `Child` (tipo UI).
- [x] El Server Action `addChild` inserta en `children` y devuelve la fila creada como `DbChild`.
- [x] `/ninos` muestra la lista vacía al cargar (sin niños mock).
- [x] El dropdown de sala en la modal muestra Soles, Terra, Luna con sus IDs como valor.
- [x] Al guardar un niño vía modal, se persiste en `children` y aparece en la lista de `/ninos` bajo la sala correspondiente.
- [x] El botón "Guardar" muestra estado de carga (disabled) durante el submit.
- [x] Al refrescar `/ninos`, los niños creados persisten (vienen de DB).
- [x] La lista de `/ninos` agrupa los niños por sala con headers dinámicos ("SALA TERRA", "SALA SOL", etc.).
- [x] Solo se muestran salas que tienen al menos un niño.
- [x] `NinosManager` recibe `rooms` y `initialChildren` por props.
- [x] `AddChildModal` recibe `rooms` por props y no importa la constante `ROOMS`.
- [x] El import de `mockChildren` fue eliminado de `app/ninos/page.tsx`.
- [x] `npm run lint` finaliza sin errores.
- [x] `npx tsc --noEmit` finaliza sin errores.
- [x] `npm run dev` no registra errores en consola.
- [x] Todos los acceptance criteria de SPEC 04 siguen pasando (regresión de modal).

## Decisions

- **Sí:** Tabla `rooms` completa con `daycare_id`, `created_at`, `updated_at` — no solo `name`.
  - **Por qué:** El schema de DB lo define así y es lo correcto. Una sala siempre pertenece a una guardería; crear la tabla incompleta genera deuda técnica inmediata.

- **Sí:** Tabla `children` completa según schema de DB — incluyendo `enrolled_at`, `photo_consent`, `status`, `medical_notes`.
  - **Por qué:** El usuario pidió explícitamente la tabla completa. Los campos no expuestos en la UI (photo_consent, status) se setean con defaults y se usarán en specs futuras.

- **Sí:** Tipo `DbChild` separado del tipo UI `Child`, con función de mapeo `mapDbChildToChild()`.
  - **Por qué:** `Child` tiene campos de UI (`initial`, `avatarBg`, `avatarColor`, `ageYears`, `birthdateLabel`, `admissionLabel`) que no viven en la DB. Mantener ambos tipos separados evita que la UI dependa de la forma de la fila DB y permite que cada uno evolucione independiente.

- **Sí:** `mapDbChildToChild()` calcula `ageYears`, `birthdateLabel` y `admissionLabel` en el momento.
  - **Por qué:** Son derivados de `birth_date` y `enrolled_at`. Almacenarlos sería redundante y se desincronizarían con el tiempo. Calcularlos en el mapping es el patrón correcto.

- **Sí:** El dropdown de sala usa `room.id` como valor y `room.name` como label.
  - **Por qué:** El Server Action necesita el UUID de la room para insertar en `children.room_id`. Usar el nombre requeriría un lookup adicional y es frágil si dos rooms tienen el mismo nombre.

- **Sí:** Política INSERT en `children` aunque el patrón DB 01/02 no incluye escritura.
  - **Por qué:** Esta spec conecta la modal a DB. Sin política INSERT y RLS habilitado, el insert falla silenciosamente. El WITH CHECK verifica que la room pertenezca al daycare del usuario — seguridad consistente con el patrón de tenencia.

- **Sí:** Server Action `addChild` en `app/(main)/ninos/actions.ts`.
  - **Por qué:** Patrón estándar de Next.js App Router para forms. El Server Action corre en el servidor con el cliente Supabase autenticado. RLS aplica automáticamente.

- **Sí:** Agrupar niños por sala en `NinosManager` con headers dinámicos.
  - **Por qué:** La UI actual tiene un header hardcoded "SALA SOLES". Con rooms reales y niños en distintas salas, agrupar por sala es la evolución natural. Solo se muestran salas con niños para no añadir ruido visual.

- **Sí:** Seed de 3 rooms en la misma migración.
  - **Por qué:** Sin rooms no se puede crear ningún niño. El seed garantiza que el dropdown tenga opciones desde el inicio.

- **Sí:** `enrolled_at` default `CURRENT_DATE` en la DB.
  - **Por qué:** El mockup no tiene campo de fecha de inscripción. La fecha de ingreso es "hoy" por defecto. Si más adelante se necesita un campo en la UI, se agrega en otra spec.

- **No:** Política UPDATE/DELETE en `children`.
  - **Por qué:** Edición y eliminación de niños están fuera de scope. Se agregan cuando la UI lo soporte.

- **No:** Mostrar rooms vacías en el listado.
  - **Por qué:** Con 0 niños, mostrar 3 secciones vacías es ruido. Para el MVP, solo se muestran salas con al menos un niño. Si el usuario quiere ver todas, se agrega en otra spec.

- **No:** Eliminar `mock-children.ts`.
  - **Por qué:** Puede estar referenciado en otras páginas (feed de SPEC 01 usa `mockChildren` para el `childList` del CreatePostModal). Solo se elimina el import de `app/ninos/page.tsx`.

- **No:** Avatar con color fijo por niño (hash del ID).
  - **Por qué:** La rotación por índice en la lista funciona para el MVP. El color puede cambiar al refrescar si se reordena la lista, pero es un detalle cosmético que no afecta la funcionalidad. Se mejora en otra spec si es necesario.

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| Migración al remoto sin rollback local | Si falla, `DROP TABLE children`, `DROP TABLE rooms`, `DROP TYPE child_status` correctivos. El seed es descartable. |
| Política INSERT con subquery sobre `rooms` | Patrón estándar de RLS multi-tabla. Postgres lo resuelve sin recursión porque `rooms` ya tiene su propia política SELECT. |
| `mapDbChildToChild()` recibe un `index` para colores de avatar | El color puede cambiar si se reordena la lista. Aceptable para MVP — se mejora con hash del ID si molesta. |
| `AddChildModal` cambia de callback síncrono a asíncrono | Rompe el contrato de props. Se actualiza en la misma spec junto con `NinosManager` — no hay otros consumidores del componente. |
| NinosManager solo muestra salas con niños | El usuario no ve las 3 salas hasta crear un niño. Mitigado: el dropdown de la modal muestra todas, así que el usuario sabe que existen. |

## What is **not** in este spec

- Edición o eliminación de niños.
- Perfil del niño (`/ninos/[id]`).
- Vinculación de padres a niños (`parent_children`).
- Políticas de UPDATE/DELETE en `rooms` o `children`.
- UI para gestionar rooms.
- Búsqueda/filtro real de niños.
- Upload de foto/avatar del niño.
- Validación de duplicados.
- Mostrar rooms vacías en el listado.
- Migraciones locales con Supabase CLI.

Cada una de esas, si se implementa, va en su propia spec.
