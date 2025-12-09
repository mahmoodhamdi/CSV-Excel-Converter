import type { SqlOptions } from '@/types';

export function writeSql(
  headers: string[],
  rows: Record<string, unknown>[],
  options: SqlOptions = {}
): string {
  const {
    tableName = 'my_table',
    includeCreate = false,
    batchSize = 100,
  } = options;

  const statements: string[] = [];

  // Generate CREATE TABLE statement if requested
  if (includeCreate) {
    const columns = headers.map((h) => `  ${escapeIdentifier(h)} TEXT`).join(',\n');
    statements.push(`CREATE TABLE ${escapeIdentifier(tableName)} (\n${columns}\n);`);
    statements.push('');
  }

  // Generate INSERT statements
  const escapedHeaders = headers.map(escapeIdentifier);
  const headerList = escapedHeaders.join(', ');

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row) => {
        const vals = headers.map((h) => escapeValue(row[h]));
        return `(${vals.join(', ')})`;
      })
      .join(',\n');

    statements.push(
      `INSERT INTO ${escapeIdentifier(tableName)} (${headerList})\nVALUES\n${values};`
    );
  }

  return statements.join('\n\n');
}

function escapeIdentifier(identifier: string): string {
  // Remove or replace invalid characters
  const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '_');
  // Quote if necessary
  if (/^[0-9]/.test(cleaned) || isReservedWord(cleaned)) {
    return `"${cleaned}"`;
  }
  return cleaned;
}

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  // String value - escape single quotes
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

function isReservedWord(word: string): boolean {
  const reserved = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'TABLE', 'INDEX', 'VIEW', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AS', 'INTO', 'VALUES', 'SET', 'LIKE', 'IN', 'BETWEEN', 'IS',
  ];
  return reserved.includes(word.toUpperCase());
}
