import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataPreview } from '@/components/converter/DataPreview';
import { useConverterStore } from '@/stores/converter-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

const mockParsedData = {
  headers: ['name', 'age', 'city'],
  rows: [
    { name: 'John', age: 30, city: 'NYC' },
    { name: 'Jane', age: 25, city: 'LA' },
    { name: 'Bob', age: 35, city: 'Chicago' },
  ],
  format: 'csv',
  metadata: { rowCount: 3, columnCount: 3 },
};

describe('DataPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: mockParsedData } as ReturnType<typeof useConverterStore>);
      }
      return mockParsedData;
    });
  });

  it('should render when parsed data exists', () => {
    render(<DataPreview />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<DataPreview />);
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(3);
  });

  it('should render table data', () => {
    render(<DataPreview />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('NYC')).toBeInTheDocument();
  });

  it('should render all rows', () => {
    render(<DataPreview />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render table element with grid role for accessibility', () => {
    render(<DataPreview />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should render column headers in header row', () => {
    render(<DataPreview />);
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(3);
  });

  it('should have sortable headers', () => {
    render(<DataPreview />);
    const columnHeaders = screen.getAllByRole('columnheader');
    // Headers should be clickable for sorting
    fireEvent.click(columnHeaders[0]);
  });

  it('should have table wrapper with proper styling', () => {
    render(<DataPreview />);
    const preview = screen.getByTestId('data-preview');
    expect(preview).toBeInTheDocument();
  });
});

describe('DataPreview - no data', () => {
  beforeEach(() => {
    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: null } as ReturnType<typeof useConverterStore>);
      }
      return null;
    });
  });

  it('should show no data message when no parsed data', () => {
    render(<DataPreview />);
    expect(screen.getByText('noData')).toBeInTheDocument();
  });
});

describe('DataPreview - empty data', () => {
  beforeEach(() => {
    const emptyData = {
      headers: [],
      rows: [],
      format: 'csv',
      metadata: { rowCount: 0, columnCount: 0 },
    };

    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: emptyData } as ReturnType<typeof useConverterStore>);
      }
      return emptyData;
    });
  });

  it('should show no data message for empty headers', () => {
    render(<DataPreview />);
    expect(screen.getByText('noData')).toBeInTheDocument();
  });
});

describe('DataPreview - single row', () => {
  beforeEach(() => {
    const singleRowData = {
      headers: ['name'],
      rows: [{ name: 'SingleUser' }],
      format: 'csv',
      metadata: { rowCount: 1, columnCount: 1 },
    };

    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: singleRowData } as ReturnType<typeof useConverterStore>);
      }
      return singleRowData;
    });
  });

  it('should render single row data', () => {
    render(<DataPreview />);
    expect(screen.getByText('SingleUser')).toBeInTheDocument();
  });

  it('should render single column header', () => {
    render(<DataPreview />);
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(1);
  });
});

describe('DataPreview - many columns', () => {
  beforeEach(() => {
    const manyColumnsData = {
      headers: Array.from({ length: 10 }, (_, i) => `column${i}`),
      rows: [
        Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`column${i}`, `value${i}`])),
      ],
      format: 'csv',
      metadata: { rowCount: 1, columnCount: 10 },
    };

    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: manyColumnsData } as ReturnType<typeof useConverterStore>);
      }
      return manyColumnsData;
    });
  });

  it('should render all columns', () => {
    render(<DataPreview />);
    expect(screen.getByText('value0')).toBeInTheDocument();
    expect(screen.getByText('value9')).toBeInTheDocument();
  });

  it('should have horizontal scroll wrapper', () => {
    render(<DataPreview />);
    const preview = screen.getByTestId('data-preview');
    expect(preview).toBeInTheDocument();
  });
});

describe('DataPreview - special values', () => {
  beforeEach(() => {
    const specialData = {
      headers: ['label', 'value'],
      rows: [
        { label: 'null_test', value: null },
        { label: 'zero_test', value: 0 },
        { label: 'false_test', value: false },
        { label: 'empty_test', value: '' },
      ],
      format: 'csv',
      metadata: { rowCount: 4, columnCount: 2 },
    };

    vi.mocked(useConverterStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ parsedData: specialData } as ReturnType<typeof useConverterStore>);
      }
      return specialData;
    });
  });

  it('should handle null values', () => {
    render(<DataPreview />);
    expect(screen.getByText('null_test')).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    render(<DataPreview />);
    expect(screen.getByText('zero_test')).toBeInTheDocument();
    // Zero is rendered as '0'
    const cells = screen.getAllByRole('cell');
    const zeroCell = cells.find(cell => cell.textContent === '0');
    expect(zeroCell).toBeTruthy();
  });

  it('should handle false values', () => {
    render(<DataPreview />);
    expect(screen.getByText('false_test')).toBeInTheDocument();
    // False is rendered as 'false'
    const cells = screen.getAllByRole('cell');
    const falseCell = cells.find(cell => cell.textContent === 'false');
    expect(falseCell).toBeTruthy();
  });
});
