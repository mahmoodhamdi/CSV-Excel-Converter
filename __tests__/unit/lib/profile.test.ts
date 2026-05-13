import { describe, it, expect } from 'vitest';
import { profileData, profileColumn } from '@/lib/profile';
import {
  inferCreateTable,
  inferTypeScriptInterface,
  inferJsonSchema,
  inferZodSchema,
} from '@/lib/schema-inference';

describe('profileColumn', () => {
  it('detects integer columns', () => {
    const result = profileColumn('age', ['30', '25', '40', '35']);
    expect(result.type).toBe('integer');
    expect(result.nullCount).toBe(0);
    expect(result.uniqueCount).toBe(4);
    expect(result.min).toBe(25);
    expect(result.max).toBe(40);
  });

  it('detects float columns', () => {
    const result = profileColumn('price', ['9.99', '19.50', '4.00']);
    expect(result.type).toBe('float');
  });

  it('promotes integer + float mix to float', () => {
    const result = profileColumn('amount', ['10', '20.5', '30']);
    expect(result.type).toBe('float');
  });

  it('detects boolean columns', () => {
    const result = profileColumn('active', ['true', 'false', 'true', 'yes', 'no']);
    expect(result.type).toBe('boolean');
  });

  it('detects date columns', () => {
    const result = profileColumn('created', ['2026-01-01', '2026-02-15', '2026-03-20']);
    expect(result.type).toBe('date');
  });

  it('detects datetime columns', () => {
    const result = profileColumn('updated', [
      '2026-01-01T10:00:00',
      '2026-02-15T11:30:00',
    ]);
    expect(result.type).toBe('datetime');
  });

  it('counts nulls and empty strings', () => {
    const result = profileColumn('name', ['John', '', null, 'Jane', undefined]);
    expect(result.nullCount).toBe(3);
    expect(result.uniqueCount).toBe(2);
  });

  it('falls back to string when mixed types', () => {
    const result = profileColumn('mixed', ['hello', '123', 'world', '2026-01-01']);
    expect(result.type).toBe('string');
  });

  it('returns top values sorted by frequency', () => {
    const result = profileColumn('status', [
      'active',
      'active',
      'active',
      'inactive',
      'inactive',
      'pending',
    ]);
    expect(result.topValues[0].value).toBe('active');
    expect(result.topValues[0].count).toBe(3);
    expect(result.topValues[1].value).toBe('inactive');
  });
});

describe('profileData', () => {
  it('profiles a full dataset', () => {
    const headers = ['id', 'name', 'amount'];
    const rows = [
      { id: '1', name: 'A', amount: '10.5' },
      { id: '2', name: 'B', amount: '20.0' },
      { id: '3', name: 'A', amount: '15.5' },
    ];
    const profile = profileData(headers, rows);
    expect(profile.rowCount).toBe(3);
    expect(profile.columnCount).toBe(3);
    expect(profile.columns[0].type).toBe('integer');
    expect(profile.columns[1].type).toBe('string');
    expect(profile.columns[2].type).toBe('float');
  });
});

describe('inferCreateTable', () => {
  const headers = ['id', 'name', 'price'];
  const rows = [
    { id: '1', name: 'A', price: '9.99' },
    { id: '2', name: 'B', price: '19.50' },
  ];
  const profile = profileData(headers, rows);

  it('generates PostgreSQL CREATE TABLE', () => {
    const sql = inferCreateTable(profile, 'products', 'postgresql');
    expect(sql).toContain('CREATE TABLE "products"');
    expect(sql).toContain('"id" INTEGER');
    expect(sql).toContain('"name" TEXT');
    expect(sql).toContain('"price" NUMERIC');
  });

  it('generates MySQL CREATE TABLE with backticks', () => {
    const sql = inferCreateTable(profile, 'products', 'mysql');
    expect(sql).toContain('`products`');
    expect(sql).toContain('`id` INT');
    expect(sql).toContain('`price` DECIMAL(15,4)');
  });

  it('generates SQLite CREATE TABLE', () => {
    const sql = inferCreateTable(profile, 'products', 'sqlite');
    expect(sql).toContain('INTEGER');
    expect(sql).toContain('REAL');
  });

  it('generates MSSQL CREATE TABLE with brackets', () => {
    const sql = inferCreateTable(profile, 'products', 'mssql');
    expect(sql).toContain('[products]');
    expect(sql).toContain('NVARCHAR(255)');
  });

  it('sanitizes identifiers with spaces or special chars', () => {
    const profile = profileData(['user name', '1invalid'], [{ 'user name': 'a', '1invalid': 'b' }]);
    const sql = inferCreateTable(profile, 'my table', 'postgresql');
    expect(sql).toContain('"my_table"');
    expect(sql).toContain('"user_name"');
    expect(sql).toContain('"_1invalid"');
  });
});

describe('inferTypeScriptInterface', () => {
  const headers = ['id', 'name', 'active', 'created'];
  const rows = [
    { id: '1', name: 'A', active: 'true', created: '2026-01-01' },
    { id: '2', name: null, active: 'false', created: '2026-02-15' },
  ];
  const profile = profileData(headers, rows);

  it('emits an interface with correct types', () => {
    const ts = inferTypeScriptInterface(profile, 'Product');
    expect(ts).toContain('export interface Product');
    expect(ts).toContain('id: number');
    expect(ts).toContain('active: boolean');
    expect(ts).toContain('created: string');
  });

  it('marks nullable columns with `?` and `| null`', () => {
    const ts = inferTypeScriptInterface(profile);
    expect(ts).toContain('name?: string | null');
  });
});

describe('inferJsonSchema', () => {
  it('produces a JSON Schema with required fields', () => {
    const profile = profileData(['id', 'name'], [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ]);
    const schema = inferJsonSchema(profile, 'Product') as { items: { required: string[]; properties: Record<string, { type: string | string[] }> } };
    expect(schema.items.required).toContain('id');
    expect(schema.items.properties.id.type).toBe('integer');
  });
});

describe('inferZodSchema', () => {
  it('emits Zod schema with coerce for numeric', () => {
    const profile = profileData(['id', 'count'], [{ id: '1', count: '10' }]);
    const zod = inferZodSchema(profile);
    expect(zod).toContain("import { z } from 'zod'");
    expect(zod).toContain('z.coerce.number().int()');
  });
});
