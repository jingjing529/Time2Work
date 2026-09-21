// Read-only source; insert-only target. Dry run is the default.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createDecipheriv } from 'node:crypto';
import pg from 'pg';
const directory = process.argv.find(v => v.startsWith('--source='))?.slice(9);
if (!directory) throw new Error('Usage: node scripts/import-json.mjs --source=/absolute/path/to/copied/organizations [--apply]');
const records = [];
for (const name of await readdir(directory)) {
  if (!/^[a-f0-9-]{36}\.json$/.test(name)) continue;
  const data = JSON.parse(await readFile(path.join(directory, name), 'utf8'));
  if (data.org?.id !== name.slice(0, -5) || !data.org?.code || !Array.isArray(data.workspace?.members)) {
    throw new Error(`Unsupported record: ${name}. Oracle legacy files require a separate migration.`);
  }
  records.push(data);
}
if (!records.length) throw new Error('No new-format records found. Oracle legacy JSON must not be imported with this tool.');
console.log(`Validated ${records.length} organization records. Source files are never modified.`);
if (!process.argv.includes('--apply')) {
  console.log('Dry run only. No database connection or writes.');
} else {
  if (!process.env.DATABASE_URL || !/^[a-f0-9]{64}$/i.test(process.env.ORGANIZATION_ENCRYPTION_KEY || '')) throw new Error('DATABASE_URL and ORGANIZATION_ENCRYPTION_KEY are required.');
  const key = Buffer.from(process.env.ORGANIZATION_ENCRYPTION_KEY, 'hex');
  // Prevent importing encrypted values that this deployment could never read.
  for (const record of records) for (const value of [record.password, record.inviteSecret].filter(Boolean)) {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(-16)); decipher.update(bytes.subarray(12, -16)); decipher.final();
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ...(process.env.DATABASE_SSL_CA ? {ssl:{ca:process.env.DATABASE_SSL_CA,rejectUnauthorized:true}} : {}) });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      // A duplicate aborts the complete import. Never overwrite a saved record.
      await client.query('INSERT INTO time2work_private.organizations (id, code, document) VALUES ($1, $2, $3::jsonb)', [record.org.id, record.org.code, JSON.stringify(record)]);
    }
    await client.query('COMMIT');
    console.log(`Imported ${records.length} records without overwriting existing data.`);
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { await client.end(); }
}
