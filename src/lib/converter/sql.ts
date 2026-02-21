/**
 * @fileoverview SQL generation utilities for exporting tabular data as SQL statements.
 *
 * This module generates SQL INSERT statements from tabular data with proper
 * identifier escaping and value quoting to prevent SQL injection.
 *
 * @module lib/converter/sql
 */

import type { SqlOptions } from '@/types';

/**
 * Generates SQL statements from tabular data.
 *
 * Creates INSERT statements with proper escaping for identifiers and values.
 * Optionally includes CREATE TABLE statement. Supports batch inserts for
 * improved performance with large datasets. Dialect-aware quoting is applied
 * to identifiers and boolean values.
 *
 * @param headers - Array of column header names (used as column identifiers)
 * @param rows - Array of row data objects keyed by header names
 * @param options - SQL generation options
 * @param options.tableName - Name of the target table (default: 'my_table')
 * @param options.includeCreate - Include CREATE TABLE statement (default: false)
 * @param options.batchSize - Number of rows per INSERT statement (default: 100)
 * @param options.dialect - SQL dialect for identifier quoting (default: 'postgresql')
 * @returns SQL string with CREATE TABLE (if requested) and INSERT statements
 *
 * @example
 * ```typescript
 * const sql = writeSql(
 *   ['name', 'age'],
 *   [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 *   { tableName: 'users', includeCreate: true, dialect: 'mysql' }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // With batch size for large datasets
 * const sql = writeSql(headers, largeDataset, { batchSize: 500 });
 * // Generates multiple INSERT statements, each with up to 500 rows
 * ```
 */
export function writeSql(
  headers: string[],
  rows: Record<string, unknown>[],
  options: SqlOptions = {}
): string {
  const {
    tableName = 'my_table',
    includeCreate = false,
    batchSize = 100,
    dialect = 'postgresql',
  } = options;

  const statements: string[] = [];

  // Generate CREATE TABLE statement if requested
  if (includeCreate) {
    const columns = headers
      .map((h) => `  ${escapeIdentifier(h, dialect)} TEXT`)
      .join(',\n');
    statements.push(
      `CREATE TABLE ${escapeIdentifier(tableName, dialect)} (\n${columns}\n);`
    );
    statements.push('');
  }

  // Generate INSERT statements
  const escapedHeaders = headers.map((h) => escapeIdentifier(h, dialect));
  const headerList = escapedHeaders.join(', ');

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row) => {
        const vals = headers.map((h) => escapeValue(row[h], dialect));
        return `(${vals.join(', ')})`;
      })
      .join(',\n');

    statements.push(
      `INSERT INTO ${escapeIdentifier(tableName, dialect)} (${headerList})\nVALUES\n${values};`
    );
  }

  return statements.join('\n\n');
}

/**
 * Escapes a SQL identifier (table name, column name) to prevent injection.
 *
 * Removes special characters and quotes identifiers that start with numbers
 * or are SQL reserved words. Quoting style is determined by the dialect:
 * MySQL uses backticks, MSSQL uses square brackets, and PostgreSQL/SQLite
 * use double quotes.
 *
 * @param identifier - The identifier to escape
 * @param dialect - SQL dialect controlling the quote style (default: 'postgresql')
 * @returns Safe SQL identifier string
 * @internal
 */
function escapeIdentifier(identifier: string, dialect: string = 'postgresql'): string {
  // Remove or replace invalid characters
  const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '_');
  // Quote if necessary
  if (/^[0-9]/.test(cleaned) || isReservedWord(cleaned)) {
    switch (dialect) {
      case 'mysql':
        return `\`${cleaned}\``;
      case 'mssql':
        return `[${cleaned}]`;
      default: // postgresql, sqlite
        return `"${cleaned}"`;
    }
  }
  return cleaned;
}

/**
 * Escapes a value for safe inclusion in SQL statements.
 *
 * Handles NULL, numbers, booleans, and strings with proper quoting.
 * Single quotes in strings are escaped by doubling them. Boolean
 * representation is dialect-specific: MSSQL uses 1/0, all others
 * use TRUE/FALSE.
 *
 * @param value - The value to escape
 * @param dialect - SQL dialect controlling boolean representation (default: 'postgresql')
 * @returns SQL-safe value string
 * @internal
 */
function escapeValue(value: unknown, dialect: string = 'postgresql'): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    if (dialect === 'mssql') return value ? '1' : '0';
    return value ? 'TRUE' : 'FALSE';
  }

  // String value - escape single quotes
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Checks if a word is a SQL reserved keyword.
 *
 * Used to determine if an identifier needs to be quoted.
 *
 * @param word - The word to check
 * @returns True if the word is a reserved SQL keyword
 * @internal
 */
function isReservedWord(word: string): boolean {
  const reserved = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'TABLE', 'INDEX', 'VIEW', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AS', 'INTO', 'VALUES', 'SET', 'LIKE', 'IN', 'BETWEEN', 'IS',
  ];
  return reserved.includes(word.toUpperCase());
}
