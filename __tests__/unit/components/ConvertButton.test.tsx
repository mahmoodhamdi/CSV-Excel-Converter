import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertButton } from '@/components/converter/ConvertButton';
import { useConverterStore } from '@/stores/converter-store';
import { convertData } from '@/lib/converter';

// Mock the converter
vi.mock('@/lib/converter', () => ({
  convertData: vi.fn().mockResolvedValue({
    success: true,
    data: '{"name":"John"}',
    format: 'json',
    metadata: { rowCount: 1, columnCount: 1, inputFormat: 'csv', outputFormat: 'json' },
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

const mockSetIsConverting = vi.fn();
const mockSetResult = vi.fn();
const mockSetConvertError = vi.fn();
const mockGetConvertOptions = vi.fn(() => ({
  outputFormat: 'json',
  csv: { delimiter: ',' },
}));

const mockParsedData = {
  headers: ['name', 'age'],
  rows: [{ name: 'John', age: 30 }],
  format: 'csv',
  metadata: { rowCount: 1, columnCount: 2 },
};

const defaultStoreState = {
  parsedData: mockParsedData,
  isConverting: false,
  setIsConverting: mockSetIsConverting,
  setResult: mockSetResult,
  setConvertError: mockSetConvertError,
  getConvertOptions: mockGetConvertOptions,
};

describe('ConvertButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
    vi.mocked(convertData).mockResolvedValue({
      success: true,
      data: '{"name":"John"}',
      format: 'json',
      metadata: { rowCount: 1, columnCount: 1, inputFormat: 'csv', outputFormat: 'json' },
    });
  });

  it('should render convert button', () => {
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('convertButton');
  });

  it('should be enabled when parsed data exists', () => {
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).not.toBeDisabled();
  });

  it('should call convert on click', async () => {
    const user = userEvent.setup();
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    await user.click(button);

    await waitFor(() => {
      expect(mockSetIsConverting).toHaveBeenCalledWith(true);
    });
  });

  it('should set result on successful conversion', async () => {
    const user = userEvent.setup();
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    await user.click(button);

    await waitFor(() => {
      expect(mockSetResult).toHaveBeenCalled();
    });
  });

  it('should reset converting state after conversion', async () => {
    const user = userEvent.setup();
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    await user.click(button);

    await waitFor(() => {
      expect(mockSetIsConverting).toHaveBeenCalledWith(false);
    });
  });

  it('should have full width', () => {
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).toHaveClass('w-full');
  });
});

describe('ConvertButton - disabled state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      parsedData: null,
    });
  });

  it('should be disabled when no parsed data', () => {
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).toBeDisabled();
  });
});

describe('ConvertButton - converting state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      isConverting: true,
    });
  });

  it('should show converting text while converting', () => {
    render(<ConvertButton />);

    expect(screen.getByText('converting')).toBeInTheDocument();
  });

  it('should be disabled while converting', () => {
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).toBeDisabled();
  });

  it('should show spinner while converting', () => {
    render(<ConvertButton />);

    const spinner = screen.getByTestId('convert-btn').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

describe('ConvertButton - error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(convertData).mockResolvedValue({
      success: false,
      error: 'Conversion failed',
      format: 'json',
    });
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
  });

  it('should set error on failed conversion', async () => {
    const user = userEvent.setup();
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    await user.click(button);

    await waitFor(() => {
      expect(mockSetConvertError).toHaveBeenCalled();
    });
  });
});
