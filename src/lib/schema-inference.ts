/**
 * Schema inference: produce a CREATE TABLE statement, a TypeScript interface,
 * and a JSON Schema document from a profiled dataset.
 *
 * The output is READ-ONLY — this is a sales feature ("look how smart it is"),
 * not a migration tool. For full schema editing, link out to the transform
 * page.
 */

import type { DataProfile, InferredType, ColumnProfile } from './profile';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite' | 'mssql';

const SQL_TYPE_MAP: Record<SqlDialect, Record<InferredType, string>> = {
  postgresql: {
    integer: 'INTEGER',
    float: 'NUMERIC',
    boolean: 'BOOLEAN',
    date: 'DATE',
    datetime: 'TIMESTAMP',
    string: 'TEXT',
    null: 'TEXT',
  },
  mysql: {
    integer: 'INT',
    float: 'DECIMAL(15,4)',
    boolean: 'BOOLEAN',
    date: 'DATE',
    datetime: 'DATETIME',
    string: 'VARCHAR(255)',
    null: 'VARCHAR(255)',
  },
  sqlite: {
    integer: 'INTEGER',
    float: 'REAL',
    boolean: 'INTEGER',
    date: 'TEXT',
    datetime: 'TEXT',
    string: 'TEXT',
    null: 'TEXT',
  },
  mssql: {
    integer: 'INT',
    float: 'DECIMAL(15,4)',
    boolean: 'BIT',
    date: 'DATE',
    datetime: 'DATETIME2',
    string: 'NVARCHAR(255)',
    null: 'NVARCHAR(255)',
  },
};

const TS_TYPE_MAP: Record<InferredType, string> = {
  integer: 'number',
  float: 'number',
  boolean: 'boolean',
  date: 'string',
  datetime: 'string',
  string: 'string',
  null: 'string',
};

const JSON_SCHEMA_TYPE_MAP: Record<InferredType, { type: string; format?: string }> = {
  integer: { type: 'integer' },
  float: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date' },
  datetime: { type: 'string', format: 'date-time' },
  string: { type: 'string' },
  null: { type: 'string' },
};

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}

function quoteIdentifier(name: string, dialect: SqlDialect): string {
  const safe = sanitizeIdentifier(name);
  switch (dialect) {
    case 'postgresql':
    case 'sqlite':
      return `"${safe}"`;
    case 'mysql':
      return `\`${safe}\``;
    case 'mssql':
      return `[${safe}]`;
  }
}

export function inferCreateTable(
  profile: DataProfile,
  tableName: string,
  dialect: SqlDialect = 'postgresql'
): string {
  const safeTable = quoteIdentifier(tableName, dialect);
  const columnLines = profile.columns.map((col) => {
    const colName = quoteIdentifier(col.name, dialect);
    const type = SQL_TYPE_MAP[dialect][col.type];
    const nullable = col.nullCount > 0 ? '' : ' NOT NULL';
    return `  ${colName} ${type}${nullable}`;
  });
  return `CREATE TABLE ${safeTable} (\n${columnLines.join(',\n')}\n);`;
}

export function inferTypeScriptInterface(
  profile: DataProfile,
  interfaceName: string = 'Row'
): string {
  const safeName = interfaceName.replace(/[^A-Za-z0-9_]/g, '');
  const lines = profile.columns.map((col) => {
    const propName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(col.name)
      ? col.name
      : JSON.stringify(col.name);
    const optional = col.nullCount > 0 ? '?' : '';
    const tsType = TS_TYPE_MAP[col.type];
    const nullable = col.nullCount > 0 ? ` | null` : '';
    return `  ${propName}${optional}: ${tsType}${nullable};`;
  });
  return `export interface ${safeName} {\n${lines.join('\n')}\n}`;
}

export function inferJsonSchema(
  profile: DataProfile,
  title: string = 'GeneratedSchema'
): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];
  for (const col of profile.columns) {
    const mapping = JSON_SCHEMA_TYPE_MAP[col.type];
    const prop: Record<string, unknown> = { type: col.nullCount > 0 ? [mapping.type, 'null'] : mapping.type };
    if (mapping.format) prop.format = mapping.format;
    if (col.uniqueCount === profile.rowCount && profile.rowCount > 0) {
      prop.description = 'Appears unique across all rows; candidate primary key.';
    }
    properties[col.name] = prop;
    if (col.nullCount === 0) required.push(col.name);
  }
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title,
    type: 'array',
    items: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    },
  };
}

export function inferZodSchema(
  profile: DataProfile,
  schemaName: string = 'RowSchema'
): string {
  const safeName = schemaName.replace(/[^A-Za-z0-9_]/g, '');
  const lines = profile.columns.map((col) => {
    const propName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(col.name)
      ? col.name
      : JSON.stringify(col.name);
    let zodType: string;
    switch (col.type) {
      case 'integer':
        zodType = 'z.coerce.number().int()';
        break;
      case 'float':
        zodType = 'z.coerce.number()';
        break;
      case 'boolean':
        zodType = 'z.coerce.boolean()';
        break;
      case 'date':
      case 'datetime':
        zodType = 'z.string()';
        break;
      default:
        zodType = 'z.string()';
    }
    if (col.nullCount > 0) zodType = `${zodType}.nullable().optional()`;
    return `  ${propName}: ${zodType},`;
  });
  return `import { z } from 'zod';\n\nexport const ${safeName} = z.object({\n${lines.join('\n')}\n});\n\nexport type Row = z.infer<typeof ${safeName}>;`;
}
