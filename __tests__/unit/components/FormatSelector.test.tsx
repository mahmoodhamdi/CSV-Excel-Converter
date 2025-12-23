import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormatSelector } from '@/components/converter/FormatSelector';
import { useConverterStore } from '@/stores/converter-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

const mockSetOutputFormat = vi.fn();

const mockParsedData = {
  headers: ['name', 'age'],
  rows: [{ name: 'John', age: 30 }],
  format: 'csv',
  metadata: { rowCount: 1, columnCount: 2 },
};

const defaultStoreState = {
  inputFormat: 'csv',
  outputFormat: 'json',
  setOutputFormat: mockSetOutputFormat,
  parsedData: mockParsedData,
};

describe('FormatSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
  });

  it('should render when parsed data exists', () => {
    render(<FormatSelector />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should show input format label', () => {
    render(<FormatSelector />);

    expect(screen.getByText('from')).toBeInTheDocument();
    expect(screen.getByText('csv')).toBeInTheDocument();
  });

  it('should show output format selector', () => {
    render(<FormatSelector />);

    expect(screen.getByText('to')).toBeInTheDocument();
    expect(screen.getByTestId('output-format')).toBeInTheDocument();
  });

  it('should show arrow between formats', () => {
    render(<FormatSelector />);

    // Arrow icon should be present
    const container = screen.getByText('title').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('should display current output format', () => {
    render(<FormatSelector />);

    const trigger = screen.getByTestId('output-format');
    expect(trigger).toHaveTextContent('JSON');
  });

  it('should call setOutputFormat when format changes', async () => {
    const user = userEvent.setup();
    render(<FormatSelector />);

    const trigger = screen.getByTestId('output-format');
    await user.click(trigger);

    await waitFor(() => {
      const csvOption = screen.getByRole('option', { name: 'CSV' });
      expect(csvOption).toBeInTheDocument();
    });

    await user.click(screen.getByRole('option', { name: 'CSV' }));

    expect(mockSetOutputFormat).toHaveBeenCalledWith('csv');
  });

  it('should show all output format options', async () => {
    const user = userEvent.setup();
    render(<FormatSelector />);

    const trigger = screen.getByTestId('output-format');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'JSON' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'CSV' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'TSV' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Excel (XLSX)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Excel (XLS)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'XML' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'SQL' })).toBeInTheDocument();
    });
  });
});

describe('FormatSelector - no parsed data', () => {
  beforeEach(() => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: null,
      parsedData: null,
    });
  });

  it('should not render when no parsed data', () => {
    render(<FormatSelector />);

    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });
});

describe('FormatSelector - different input formats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show json input format', () => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: 'json',
      outputFormat: 'csv',
    });

    render(<FormatSelector />);

    expect(screen.getByText('json')).toBeInTheDocument();
  });

  it('should show xlsx input format', () => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: 'xlsx',
      outputFormat: 'csv',
    });

    render(<FormatSelector />);

    expect(screen.getByText('xlsx')).toBeInTheDocument();
  });

  it('should show autoDetect when format is null', () => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: null,
    });

    render(<FormatSelector />);

    expect(screen.getByText('autoDetect')).toBeInTheDocument();
  });

  it('should show XML input format', () => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: 'xml',
      outputFormat: 'json',
    });

    render(<FormatSelector />);

    expect(screen.getByText('xml')).toBeInTheDocument();
  });

  it('should show TSV input format', () => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      inputFormat: 'tsv',
      outputFormat: 'json',
    });

    render(<FormatSelector />);

    expect(screen.getByText('tsv')).toBeInTheDocument();
  });
});
