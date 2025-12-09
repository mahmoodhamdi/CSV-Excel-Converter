import type { InputFormat } from '@/types';

export function detectFormat(data: string): InputFormat {
  const trimmed = data.trim();

  // Check for JSON
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    const hasClosingTag = /<\/\w+>/.test(trimmed);
    if (hasClosingTag) {
      return 'xml';
    }
  }

  // Check for TSV (tab-separated)
  const delimiter = detectDelimiter(trimmed);
  if (delimiter === '\t') {
    return 'tsv';
  }

  // Default to CSV
  return 'csv';
}

export function detectDelimiter(data: string): string {
  const delimiters = [
    { char: ',', weight: 1 },
    { char: ';', weight: 1 },
    { char: '\t', weight: 1.5 }, // Slight preference for tabs
    { char: '|', weight: 1 },
  ];

  const lines = data.split('\n').slice(0, 5); // Check first 5 lines
  const counts = new Map<string, number>();

  for (const { char, weight } of delimiters) {
    let totalCount = 0;
    let consistentCount = true;
    let prevCount = -1;

    for (const line of lines) {
      if (!line.trim()) continue;
      const count = (line.match(new RegExp(char === '\t' ? '\t' : `\\${char}`, 'g')) || []).length;
      totalCount += count;

      if (prevCount !== -1 && count !== prevCount) {
        consistentCount = false;
      }
      prevCount = count;
    }

    // Reward consistent delimiter counts across lines
    const finalScore = totalCount * weight * (consistentCount ? 1.5 : 1);
    counts.set(char, finalScore);
  }

  let maxCount = 0;
  let detectedDelimiter = ',';

  counts.forEach((count, char) => {
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = char;
    }
  });

  return detectedDelimiter;
}

export function detectFormatFromFilename(filename: string): InputFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();

  const formatMap: Record<string, InputFormat> = {
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    xlsx: 'xlsx',
    xls: 'xls',
    xml: 'xml',
  };

  return formatMap[ext || ''] || null;
}

export function detectFormatFromMimeType(mimeType: string): InputFormat | null {
  const mimeMap: Record<string, InputFormat> = {
    'text/csv': 'csv',
    'text/tab-separated-values': 'tsv',
    'application/json': 'json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/xml': 'xml',
    'text/xml': 'xml',
  };

  return mimeMap[mimeType] || null;
}
