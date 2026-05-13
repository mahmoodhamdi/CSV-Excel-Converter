#!/usr/bin/env node
/**
 * Generate an API key for /api/v2/* endpoints.
 *
 * Standalone — does not import TypeScript so it runs without compilation.
 * Schema must stay in sync with src/lib/api-keys.ts.
 *
 * Usage:
 *   node scripts/gen-api-key.mjs --label="customer-alpha" --tier=pro
 *   node scripts/gen-api-key.mjs --list
 *   node scripts/gen-api-key.mjs --revoke <id>
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const KEY_PREFIX = 'mwm_';
const SCRYPT_KEYLEN = 64;
const VALID_TIERS = ['free', 'pro', 'scale', 'enterprise'];

function storePath() {
  return process.env.API_KEYS_FILE ?? path.join(process.cwd(), '.api-keys.json');
}

async function readStore() {
  try {
    const raw = await fs.readFile(storePath(), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return { version: 1, keys: [] };
    throw err;
  }
}

async function writeStore(store) {
  const p = storePath();
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
  await fs.rename(tmp, p);
}

function hashKey(plaintext, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(plaintext, salt, SCRYPT_KEYLEN, (err, derived) => {
      if (err) return reject(err);
      resolve(derived.toString('hex'));
    });
  });
}

function parseArgs(argv) {
  const out = { label: null, tier: 'free', action: 'create' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') out.action = 'list';
    else if (a === '--revoke') {
      out.action = 'revoke';
      out.id = argv[++i];
    } else if (a.startsWith('--label=')) out.label = a.split('=')[1];
    else if (a === '--label') out.label = argv[++i];
    else if (a.startsWith('--tier=')) out.tier = a.split('=')[1];
    else if (a === '--tier') out.tier = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage:');
      console.log('  --label=<name> --tier=<free|pro|scale|enterprise>   Generate new key');
      console.log('  --list                                              List keys (without hashes)');
      console.log('  --revoke <id>                                       Revoke key by id');
      process.exit(0);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.action === 'list') {
    const store = await readStore();
    const safe = store.keys.map(({ hash: _h, salt: _s, ...rest }) => rest);
    console.log(JSON.stringify(safe, null, 2));
    return;
  }

  if (args.action === 'revoke') {
    if (!args.id) {
      console.error('Missing key id');
      process.exit(1);
    }
    const store = await readStore();
    const record = store.keys.find((k) => k.id === args.id);
    if (!record) {
      console.log(`Not found: ${args.id}`);
      return;
    }
    record.enabled = false;
    await writeStore(store);
    console.log(`Revoked: ${args.id}`);
    return;
  }

  if (!args.label) {
    console.error('Missing --label. Try --help.');
    process.exit(1);
  }

  if (!VALID_TIERS.includes(args.tier)) {
    console.error(`Invalid tier: ${args.tier}. Must be one of: ${VALID_TIERS.join(', ')}`);
    process.exit(1);
  }

  const random = crypto.randomBytes(24).toString('base64url');
  const plaintext = `${KEY_PREFIX}${random}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashKey(plaintext, salt);

  const record = {
    id: crypto.randomUUID(),
    label: args.label,
    tier: args.tier,
    hash,
    salt,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    callCount: 0,
    enabled: true,
  };

  const store = await readStore();
  store.keys.push(record);
  await writeStore(store);

  const { hash: _h, salt: _s, ...safe } = record;

  console.log('');
  console.log('API key generated. Save this — it will not be shown again:');
  console.log('');
  console.log(`  ${plaintext}`);
  console.log('');
  console.log('Metadata:');
  console.log(JSON.stringify(safe, null, 2));
  console.log('');
  console.log(`Stored at: ${storePath()}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
