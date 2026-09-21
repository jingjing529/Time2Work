# Separate Next.js deployment

This worktree/branch (`next-version`) is the new app. `main` holds the Oracle Python/React baseline. Do not merge this branch into main or change Oracle's deployment during evaluation.

## Storage

The server now supports PostgreSQL via `DATABASE_URL`. Organization documents are initially stored in a private JSONB table, preserving existing IDs, invite hashes, role rules, sessions and availability. Requests lock the organization row and commit writes atomically. This is a transitional document schema, not a normalized relational model; organization listing still reads all documents on the server. Guest/member filtering remains in the authenticated API. The private schema has RLS enabled and no public policies; browsers must never receive database credentials.

Without DATABASE_URL, local development still uses the copied `.local/organizations` directory. Vercel requires a database and refuses filesystem fallback. This branch's local data is a copy; the original folder and Oracle data are unchanged.

## New staging project

1. Create an independent Supabase project. Run `t2w/migrations/001-organizations.sql` in its SQL editor.
2. Use the Supabase **Connect → Transaction pooler** connection string for server-only `DATABASE_URL`. Follow Supabase TLS guidance; do not disable certificate verification.
3. Set a stable server-only `ORGANIZATION_ENCRYPTION_KEY` (32 random bytes encoded as hex). For importing existing Next.js records, use the copied encryption.key encoded as hex instead. Keep the key in a secret store and backed up separately.
4. Create a separate Vercel project from branch `next-version`. Root directory: `t2w`; framework: Next.js; Node: 22.x. Explicitly set this project's production branch to `next-version`, not `main`.
5. Set DATABASE_URL, ORGANIZATION_ENCRYPTION_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI. Add the exact new `/api/auth/google/callback` URL in Google Cloud OAuth settings. Keep the Oracle settings intact.
6. Test only with copied data/new accounts before changing any live domain.

## Data import

`node scripts/import-json.mjs --source=/absolute/path/to/copied/organizations` validates with no writes. Add `--apply` only after configuring an independent target database and the correct encryption key. The importer inserts only: any duplicate aborts and rolls back the entire import. It never modifies source files.

This importer handles the **new Next.js JSON format only**. The Oracle legacy format (name → boolean time slots) requires a separate identity-mapping migration. Do not guess Google identities from display names or import live files blindly.

## Validation still required before launch

Run the schema and transactional/concurrent-write tests against a real staging PostgreSQL database; exercise Google login, admin/member/guest authorization, copied-data counts, encrypted password/invite compatibility and scheduling conflicts. Existing domain tests alone do not verify hosted database behavior. Current whole-array admin edits and Google access-token expiration also need production hardening. Preserve the old site until these checks pass.

References: [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Vercel Postgres](https://vercel.com/docs/postgres).
