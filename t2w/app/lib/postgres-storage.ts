import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool } from 'pg';

type StoredRecord = { org: { id: string; code: string }; [key: string]: unknown };
type Transaction = { records: Map<string, StoredRecord>; dirty: Set<string> };
const context = new AsyncLocalStorage<Transaction>();
let pool: Pool | undefined;
export function currentStorage() { return context.getStore(); }
export function requireStorageContext() {
  if ((process.env.DATABASE_URL || process.env.VERCEL) && !currentStorage()) {
    throw new Error('Database storage must run inside a transaction.');
  }
}

/** Keeps the existing domain rules synchronous, inside one locked database transaction.
 * Only the requested organization is loaded, except the membership index.
 * No data or credentials are exposed through the Supabase browser API.
 */
export async function withOrganizationStorage<T>(input: { action?: string; id?: string; org?: { id?: string }; token?: string; code?: string }, action: () => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL) throw new Error('DATABASE_URL is required on Vercel.');
    return action();
  }
  if (!/^[a-f0-9]{64}$/i.test(process.env.ORGANIZATION_ENCRYPTION_KEY || '')) {
    throw new Error('A 32-byte ORGANIZATION_ENCRYPTION_KEY is required.');
  }
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ...(process.env.DATABASE_SSL_CA ? {ssl:{ca:process.env.DATABASE_SSL_CA,rejectUnauthorized:true}} : {}), max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let rows: { document: StoredRecord }[] = [];
    const id = input.id || input.org?.id || input.token?.split('.')[0];
    if (input.action === 'org-list') {
      // Role filtering still happens server-side in organizationIndex.
      rows = (await client.query('SELECT document FROM time2work_private.organizations')).rows;
    } else if (input.action === 'org-join-code') {
      rows = (await client.query('SELECT document FROM time2work_private.organizations WHERE code = $1 FOR UPDATE', [String(input.code || '').trim().toUpperCase()])).rows;
    } else if (id) {
      if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid organization.');
      rows = (await client.query('SELECT document FROM time2work_private.organizations WHERE id = $1 FOR UPDATE', [id])).rows;
    }
    const state: Transaction = { records: new Map(rows.map(r => [r.document.org.id, r.document])), dirty: new Set() };
    const result = await context.run(state, action);
    for (const id of state.dirty) {
      const record = state.records.get(id)!;
      await client.query(`INSERT INTO time2work_private.organizations (id, code, document)
        VALUES ($1, $2, $3::jsonb) ON CONFLICT (id) DO UPDATE
        SET code = EXCLUDED.code, document = EXCLUDED.document, updated_at = now()`, [id, record.org.code, JSON.stringify(record)]);
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
