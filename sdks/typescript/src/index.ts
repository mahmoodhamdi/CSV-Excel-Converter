/**
 * @mwm/csv-converter-sdk
 *
 * Official TypeScript client for the CSV Excel Converter API.
 *
 * Targets the /api/v2/* commercial endpoints which require an API key.
 * The free /api/* endpoints accept the same request shapes and can be
 * used by passing a baseUrl that points to v1.
 */

export type InputFormat = 'csv' | 'tsv' | 'json' | 'xlsx' | 'xls' | 'xml';
export type OutputFormat = InputFormat | 'sql';

export interface ConvertOptions {
  csv?: {
    delimiter?: string;
    hasHeader?: boolean;
    skipEmptyLines?: boolean;
    trimValues?: boolean;
  };
  json?: {
    prettyPrint?: boolean;
    indent?: number;
  };
  excel?: {
    sheetName?: string;
    autoFitColumns?: boolean;
  };
  sql?: {
    tableName?: string;
    dialect?: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
    includeCreate?: boolean;
    batchSize?: number;
  };
}

export interface ConvertRequest {
  data: string;
  inputFormat?: InputFormat;
  outputFormat: OutputFormat;
  options?: ConvertOptions;
  fileName?: string;
}

export interface ConvertResponse {
  success: true;
  data: string;
  metadata: {
    inputFormat: InputFormat;
    outputFormat: OutputFormat;
    rowCount: number;
    columnCount: number;
  };
  fileName: string;
  requestId: string;
  apiTier?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  requestId: string;
}

export class ConverterApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ConverterApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

export interface ClientOptions {
  /** Base URL of the API. Default: https://api.csv-excel-converter.com */
  baseUrl?: string;
  /** API key (mwm_...). Required for /api/v2/* endpoints. */
  apiKey?: string;
  /** Optional fetch implementation (for testing or non-browser environments). */
  fetch?: typeof fetch;
  /** Per-request timeout in milliseconds. Default: 60000 */
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.csv-excel-converter.com';

export class ConverterClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    if (!this.fetchImpl) {
      throw new Error(
        'No fetch implementation found. Pass options.fetch on Node < 18.'
      );
    }
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.apiKey) h['X-API-Key'] = this.apiKey;
    return h;
  }

  private async request<T>(
    path: string,
    init: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok || (json && json.success === false)) {
        const err = json as ApiErrorResponse;
        throw new ConverterApiError(
          err?.error ?? `HTTP ${res.status}`,
          err?.code ?? 'HTTP_ERROR',
          res.status,
          err?.requestId ?? 'unknown',
          err?.details
        );
      }
      return json as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Convert data between formats.
   *
   * @example
   * ```ts
   * const client = new ConverterClient({ apiKey: 'mwm_...' });
   * const result = await client.convert({
   *   data: 'name,age\nJohn,30',
   *   inputFormat: 'csv',
   *   outputFormat: 'json',
   * });
   * console.log(result.data); // '[{"name":"John","age":"30"}]'
   * ```
   */
  async convert(req: ConvertRequest): Promise<ConvertResponse> {
    const path = this.apiKey ? '/api/v2/convert' : '/api/convert';
    return this.request<ConvertResponse>(path, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    });
  }

  /**
   * Parse data and return structured rows + inferred schema.
   *
   * Useful for preview UIs.
   */
  async parse(data: string, inputFormat?: InputFormat) {
    const path = '/api/parse';
    return this.request<{
      success: true;
      data: {
        headers: string[];
        rows: Record<string, unknown>[];
        format: InputFormat;
        metadata: { rowCount: number; columnCount: number };
      };
      requestId: string;
    }>(path, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ data, inputFormat }),
    });
  }

  /**
   * List supported formats.
   */
  async formats() {
    return this.request<{
      success: true;
      data: { input: InputFormat[]; output: OutputFormat[] };
    }>('/api/formats', { method: 'GET', headers: this.headers() });
  }

  /**
   * Health check.
   */
  async health() {
    return this.request<{ status: string; timestamp: string }>('/api/health', {
      method: 'GET',
      headers: this.headers(),
    });
  }

  /**
   * Inspect the API key in use: tier, usage count, last-used.
   *
   * Requires an API key.
   */
  async keyInfo() {
    if (!this.apiKey) {
      throw new Error('keyInfo() requires an API key. Pass apiKey in client options.');
    }
    return this.request<{
      success: true;
      key: {
        id: string;
        label: string;
        tier: string;
        createdAt: string;
        lastUsedAt: string | null;
        callCount: number;
      };
      limits: { perMinute: number | null; burst: number | null };
    }>('/api/v2/keys', { method: 'GET', headers: this.headers() });
  }
}

export default ConverterClient;
