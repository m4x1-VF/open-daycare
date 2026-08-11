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

## Reference materials = product source of truth

- `reference/pantallas/*.dc.html` — screen mockups for the daycare app (filenames in Spanish: `feed`, `ninos`, `resumen-dia`, `login`, `crear-publicacion`, `detalle-publicacion`, `perfil-nino`, `vincular-padre`, `familia-feed`, `familia-cuenta`, `activar-cuenta`, `agregar-nino`, `avisos`, `foto`, `mi-cuenta`, `index`). `support.js` is shared by these mockups.
- `reference/screenshots/*.png` — rendered previews of the same screens.
- **When implementing a UI screen, consult the matching `reference/pantallas/<name>.dc.html` first.** The current `app/page.tsx` is just the create-next-app starter and will be replaced.

## Tooling

- `opencode.json` only wires the **Playwright MCP** server (`npx @playwright/mcp@latest`). `.playwright-mcp/` is gitignored; treat its contents as scratch.
- `CLAUDE.md` is just `@AGENTS.md` — do not duplicate content there; edit this file.
- Locally installed skills: `spec` and `spec-impl` (see `skills-lock.json`, sourced from `klerith/fernando-skills`). Use the `spec` skill when starting a feature from the reference mockups, `spec-impl` to implement an approved spec.

## MCPs

- Playwright: screenshoots and any Playwright output go in `.playwright-mcp*`
- Context7: use it to fetch current framework docs instead of relying on training data.

## Spec Driven Development - Skills

- /spec: Usaremos esta habilidad para crear las especificaciones.
- /spec-impl: Usaremos esta skill para hacer las implementaciones.

## Reglas de código

- Usar Clean Architecture
- Usar nombres de variables, funciones, etc en ingles.