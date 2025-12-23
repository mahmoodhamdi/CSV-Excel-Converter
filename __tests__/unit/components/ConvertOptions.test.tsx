import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertOptions } from '@/components/converter/ConvertOptions';
import { useConverterStore } from '@/stores/converter-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

// Mock validation schemas
vi.mock('@/lib/validation/schemas', () => ({
  sqlOptionsSchema: {
    shape: {
      tableName: {
        safeParse: vi.fn((value: string) => {
          if (!value || value.length === 0) {
            return { success: false, error: { errors: [{ message: 'Table name required' }] } };
          }
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            return { success: false, error: { errors: [{ message: 'Invalid table name' }] } };
          }
          return { success: true, data: value };
        }),
      },
    },
  },
  excelOptionsSchema: {
    shape: {
      sheetName: {
        safeParse: vi.fn((value: string) => {
          if (value && value.length > 31) {
            return { success: false, error: { errors: [{ message: 'Sheet name too long' }] } };
          }
          return { success: true, data: value };
        }),
      },
    },
  },
}));

const mockSetCsvOptions = vi.fn();
const mockSetJsonOptions = vi.fn();
const mockSetExcelOptions = vi.fn();
const mockSetSqlOptions = vi.fn();

const mockParsedData = {
  headers: ['name', 'age'],
  rows: [{ name: 'John', age: 30 }],
  format: 'csv',
  metadata: { rowCount: 1, columnCount: 2 },
};

const defaultStoreState = {
  outputFormat: 'csv',
  csvOptions: { delimiter: ',', hasHeader: true },
  jsonOptions: { prettyPrint: true, indentation: 2 },
  excelOptions: { sheetName: 'Sheet1', headerStyle: true },
  sqlOptions: { tableName: 'my_table', includeCreate: false, batchSize: 100 },
  setCsvOptions: mockSetCsvOptions,
  setJsonOptions: mockSetJsonOptions,
  setExcelOptions: mockSetExcelOptions,
  setSqlOptions: mockSetSqlOptions,
  parsedData: mockParsedData,
};

describe('ConvertOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
  });

  it('should render when parsed data exists', () => {
    render(<ConvertOptions />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should render toggle button', () => {
    render(<ConvertOptions />);

    expect(screen.getByTestId('options-toggle')).toBeInTheDocument();
  });

  it('should expand on toggle click', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    const toggle = screen.getByTestId('options-toggle');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('csvOptions')).toBeInTheDocument();
    });
  });
});

describe('ConvertOptions - CSV format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      outputFormat: 'csv',
    });
  });

  it('should show CSV options when expanded', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    await user.click(screen.getByTestId('options-toggle'));

    await waitFor(() => {
      expect(screen.getByText('csvOptions')).toBeInTheDocument();
    });
  });
});

describe('ConvertOptions - JSON format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      outputFormat: 'json',
    });
  });

  it('should show JSON options when expanded', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    await user.click(screen.getByTestId('options-toggle'));

    await waitFor(() => {
      expect(screen.getByText('jsonOptions')).toBeInTheDocument();
    });
  });
});

describe('ConvertOptions - Excel format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      outputFormat: 'xlsx',
    });
  });

  it('should show Excel options when expanded', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    await user.click(screen.getByTestId('options-toggle'));

    await waitFor(() => {
      expect(screen.getByText('excelOptions')).toBeInTheDocument();
    });
  });
});

describe('ConvertOptions - SQL format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      outputFormat: 'sql',
    });
  });

  it('should show SQL options when expanded', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    await user.click(screen.getByTestId('options-toggle'));

    await waitFor(() => {
      expect(screen.getByText('sqlOptions')).toBeInTheDocument();
    });
  });
});

describe('ConvertOptions - no parsed data', () => {
  beforeEach(() => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      parsedData: null,
    });
  });

  it('should not render when no parsed data', () => {
    render(<ConvertOptions />);

    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });
});

describe('ConvertOptions - TSV format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      outputFormat: 'tsv',
    });
  });

  it('should show TSV options when expanded', async () => {
    const user = userEvent.setup();
    render(<ConvertOptions />);

    await user.click(screen.getByTestId('options-toggle'));

    // TSV shares options with CSV
    await waitFor(() => {
      expect(screen.getByText('csvOptions')).toBeInTheDocument();
    });
  });
});
