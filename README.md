# open-daycare

Next.js 16 (App Router) + Supabase application for daycare/family communication.

## Requirements

- Node.js 20+
- npm
- Supabase CLI (`npm i -g supabase` or see [docs](https://supabase.com/docs/guides/local-development/cli/getting-started))

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (see `.env.template` for the full list):

   ```bash
   cp .env.template .env.local
   ```

   Required for the app to run:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dkwzoobnaaxxpovxxgvt.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Optional (used by specific integrations): `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_DB_PASSWORD`.

   Actual values are shared within the team — never commit a real `.env`.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (the only check script) |
| `npx tsc --noEmit` | Typecheck (no dedicated script) |
## Supabase agent skills

Install the official Supabase agent skills locally so AI agents get critical development and security guidance:

```bash
npx skills add supabase/agent-skills
```

## Supabase CLI — authentication

The project connects to a shared remote Supabase project (`project_ref=dkwzoobnaaxxpovxxgvt`). To use the CLI against it (linking, migrations, DB push, etc.) every team member must follow these steps:

1. Authenticate the opencode MCP server:

   ```bash
   opencode mcp auth supabase
   ```

   This authenticates the Supabase MCP server configured in `opencode.json` (project `dkwzoobnaaxxpovxxgvt`) so AI agents can inspect the DB and apply migrations.

2. Log in with your Supabase account:

   ```bash
   supabase login
   ```

   This opens the browser to authenticate. Alternatively use a personal access token (generated at https://supabase.com/dashboard/account/tokens):

   ```bash
   supabase login --token sbp_...
   ```

3. Link the local project to the remote one:

   ```bash
   supabase link --project-ref dkwzoobnaaxxpovxxgvt
   ```

   It will ask for the database password when needed.

4. Verify it's linked:

   ```bash
   supabase projects list
   supabase --help
   ```

Note: the MCP Supabase server (`opencode.json`) already targets this `project_ref`, so AI agents can apply migrations without local CLI auth — but the migration SQL must always be written to `supabase/migrations/`.

## Database migrations

Every schema change must produce a migration file:

- File naming: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
- Each file reflects the **final state** (fold later `ALTER`s into the original `CREATE`)
- A clean database must be rebuildable from the folder alone

Schema source of truth: `opendaycare-database-schema.md` in the `07-DB-Schema` project references.
