<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# open-daycare

Next.js 16.3.0 App Router app (React 19.2.8, TypeScript strict, Tailwind v4). Currently a fresh `create-next-app` starter being built toward a daycare/family communication product. The UI source of truth lives in `reference/`, not in `app/`.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (regenerates the block at the top of this file if missing)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint flat config (`eslint.config.mjs`); this is the **only** check script; there is **no** `typecheck` or `test` script
- Typecheck manually: `npx tsc --noEmit`
- No test runner, no CI workflows, no pre-commit hooks. Do not invent test commands.

## Stack notes & gotchas

- **Next 16, not 15.** App Router only; `app/layout.tsx` is the root layout, `app/page.tsx` the home route. Typed route helpers (e.g. `LayoutProps<"/">`) come from Next 16 — read `node_modules/next/dist/docs/01-app/` before touching route types.
- **Tailwind v4 (CSS-first).** No `tailwind.config.js`. Theme tokens are CSS variables defined in `app/globals.css` under `@theme inline` (`--color-background`, `--color-foreground`, `--font-geist-sans`, `--font-geist-mono`). PostCSS plugin is `@tailwindcss/postcss`. Style with utility classes + CSS vars, not a JS config.
- **Path alias:** `@/*` → `./*` (repo root). Prefer `@/app/...`, `@/reference/...` over relative imports.
- **Fonts:** Geist + Geist Mono via `next/font/google`, exposed as CSS vars on `<html>` in `app/layout.tsx`.
- **LSP:** enabled globally via `"lsp": true` in `opencode.json`.

## Reference materials = product source of truth

- `reference/pantallas/*.dc.html` — screen mockups for the daycare app (filenames in Spanish: `feed`, `ninos`, `resumen-dia`, `login`, `crear-publicacion`, `detalle-publicacion`, `perfil-nino`, `vincular-padre`, `familia-feed`, `familia-cuenta`, `activar-cuenta`, `agregar-nino`, `avisos`, `foto`, `mi-cuenta`, `index`). `support.js` is shared by these mockups.
- `reference/screenshots/*.png` — rendered previews of the same screens.
- **When implementing a UI screen, consult the matching `reference/pantallas/<name>.dc.html` first.** The current `app/page.tsx` is just the create-next-app starter and will be replaced.

## Supabase / Database

- Backend target: **Supabase (PostgreSQL)**. Remote MCP server configured in `opencode.json` with `project_ref=dkwzoobnaaxxpovxxgvt` and features `docs, account, database, debugging, development, functions, branching`.
- **App ↔ DB interaction goes through the official Supabase packages for Next.js:** `@supabase/supabase-js` + `@supabase/ssr` (installed). Never hand-roll REST calls (`fetch` to `/rest/v1`) or add another ORM/data client. Use the helpers in `utils/supabase/`:
  - `utils/supabase/server.ts` → `createClient(await cookies())` in Server Components, Server Actions and Route Handlers.
  - `utils/supabase/client.ts` → `createClient()` (no args) in Client Components (browser; realtime, auth listeners).
  - `proxy.ts` (project root — Next 16 replaced `middleware.ts`) → refreshes the auth session on every request via `supabase.auth.getClaims()`. Do not add a `middleware.ts`.
  - Env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` live in `.env.local` (real values gitignored). Auth checks on the server must use `getClaims()`/`getUser()`, never `getSession()`.
- **Every DB change must produce a migration file.** Even when the schema change is applied directly to the remote project via MCP (`supabase_apply_migration` / `supabase_execute_sql`), always write the equivalent SQL to `supabase/migrations/YYYYMMDDHHMMSS_name.sql` (Supabase CLI naming convention) and commit it with the change. The file reflects the **final state** (fold later `ALTER`s into the original `CREATE`) so a clean database can be rebuilt from the folder alone. No DB manipulation without its file.
- **DB schema source of truth (NOT implemented yet):** project reference `docs` → `../07-DB-Schema` (`opendaycare-database-schema.md`). Table dictionary, ENUMs, and constraints live there. Consult it before creating migrations or types.
- **Schema conventions:** PK `id` as `uuid` (`gen_random_uuid()`), `created_at`/`updated_at` as `timestamptz`. Everything persisted in the DB is in **English** (enums, tags, codes); UI labels are translated to Spanish at the view layer.
- **Env vars:** `.env.template` is committed (gitignore exception `!.env.template`) as the reference for required variables. Never commit a real `.env`.

## Tooling

- `opencode.json` wires MCP servers: **Playwright**, **Context7**, **Engram**, **Supabase** (baserow/github/open-design disabled). `.playwright-mcp/` is gitignored; treat its contents as scratch.
- `CLAUDE.md` is just `@AGENTS.md` — do not duplicate content there; edit this file.
- Locally installed skills (see `skills-lock.json`):
  - `spec` and `spec-impl` (from `klerith/fernando-skills`) — use `spec` when starting a feature from the reference mockups, `spec-impl` to implement an approved spec.
  - `supabase` (from `supabase/agent-skills`, in `.agents/skills/supabase/`) — load for ANY Supabase task: Auth, RLS, Edge Functions, Storage, Realtime, CLI, `@supabase/ssr`, migrations, debugging.
  - `supabase-postgres-best-practices` (from `supabase/agent-skills`, in `.agents/skills/supabase-postgres-best-practices/`) — load BEFORE writing/changing anything that lives in Postgres: tables, columns, indexes, RLS policies, triggers, functions, migrations, queries.

## MCPs

- Playwright: screenshoots and any Playwright output go in `.playwright-mcp*`
- Context7: use it to fetch current framework docs instead of relying on training data.
- Supabase: schema changes, migrations, edge functions, logs, advisors. Prefer local dev + Supabase CLI before touching the remote project (`project_ref=dkwzoobnaaxxpovxxgvt`).

## Spec Driven Development - Skills

- /spec: Usaremos esta habilidad para crear las especificaciones.
- /spec-impl: Usaremos esta skill para hacer las implementaciones.
- `spec-verifier` (subagent): Verifica los acceptance criteria de un spec. Se invoca con la herramienta Task (`subagent_type: spec-verifier`). Lee el spec, extrae cada `- [ ]` de la sección "Acceptance criteria", los clasifica (código / lint-typecheck / UI / convenciones de Next.js) y los verifica con `read`/`grep`, `Context7` y `Playwright`. Marca `- [x]` los que pasan y reporta los que fallan con recomendaciones. No modifica código fuente, solo los checkboxes del spec. Definido en `.opencode/agents/spec-verifier.md`.

## Reglas de código

- Usar Clean Architecture
- Usar nombres de variables, funciones, etc en ingles.