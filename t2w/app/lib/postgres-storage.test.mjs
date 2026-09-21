import test from 'node:test';
import assert from 'node:assert/strict';
import { withOrganizationStorage, requireStorageContext } from './postgres-storage.ts';

test('Vercel refuses local JSON fallback when database configuration is missing', async () => {
 const before = { url: process.env.DATABASE_URL, vercel: process.env.VERCEL };
 delete process.env.DATABASE_URL; process.env.VERCEL = '1';
 try {
  let called = false;
  await assert.rejects(withOrganizationStorage({}, async () => { called = true; }), /DATABASE_URL/);
  assert.equal(called, false);
  assert.throws(requireStorageContext, /transaction/);
 } finally {
  for (const [key, value] of [['DATABASE_URL', before.url], ['VERCEL', before.vercel]]) {
   if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
 }
});

test('database access refuses missing encryption key before connecting or executing writes', async () => {
 const before = { url: process.env.DATABASE_URL, key: process.env.ORGANIZATION_ENCRYPTION_KEY };
 process.env.DATABASE_URL = 'postgres://unused'; delete process.env.ORGANIZATION_ENCRYPTION_KEY;
 try {
  let called = false;
  await assert.rejects(withOrganizationStorage({}, async () => { called = true; }), /ENCRYPTION_KEY/);
  assert.equal(called, false);
 } finally {
  for (const [key, value] of [['DATABASE_URL', before.url], ['ORGANIZATION_ENCRYPTION_KEY', before.key]]) {
   if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
 }
});
