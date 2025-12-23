import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertResult } from '@/components/converter/ConvertResult';
import { useConverterStore } from '@/stores/converter-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock utils
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    downloadFile: vi.fn(),
    copyToClipboard: vi.fn().mockResolvedValue(undefined),
    getMimeType: vi.fn().mockReturnValue('application/json'),
  };
});

// Mock converter
vi.mock('@/lib/converter', () => ({
  getOutputFilename: vi.fn().mockReturnValue('output.json'),
}));

// Mock the store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

const mockReset = vi.fn();

const successResult = {
  success: true,
  data: '{"name":"John","age":30}',
  format: 'json',
  metadata: {
    rowCount: 1,
    columnCount: 2,
    inputFormat: 'csv',
    outputFormat: 'json',
  },
};

const defaultStoreState = {
  result: successResult,
  outputFormat: 'json',
  fileName: 'test.csv',
  reset: mockReset,
};

describe('ConvertResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
  });

  it('should render when result is successful', () => {
    render(<ConvertResult />);

    expect(screen.getByTestId('convert-result')).toBeInTheDocument();
  });

  it('should show success message', () => {
    render(<ConvertResult />);

    expect(screen.getByText('convertSuccess')).toBeInTheDocument();
  });

  it('should display result preview for text output', () => {
    render(<ConvertResult />);

    expect(screen.getByText(/{"name":"John","age":30}/)).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(<ConvertResult />);

    expect(screen.getByRole('button', { name: /downloadResult/i })).toBeInTheDocument();
  });

  it('should render copy button for text output', () => {
    render(<ConvertResult />);

    expect(screen.getByRole('button', { name: /copyResult/i })).toBeInTheDocument();
  });

  it('should render new conversion button', () => {
    render(<ConvertResult />);

    expect(screen.getByRole('button', { name: /newConversion/i })).toBeInTheDocument();
  });

  it('should call download on download button click', async () => {
    const user = userEvent.setup();
    const { downloadFile } = await import('@/lib/utils');

    render(<ConvertResult />);

    const downloadButton = screen.getByRole('button', { name: /downloadResult/i });
    await user.click(downloadButton);

    expect(downloadFile).toHaveBeenCalled();
  });

  it('should call copy on copy button click', async () => {
    const user = userEvent.setup();
    const { copyToClipboard } = await import('@/lib/utils');

    render(<ConvertResult />);

    const copyButton = screen.getByRole('button', { name: /copyResult/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(successResult.data);
    });
  });

  it('should show copied state after copy', async () => {
    const user = userEvent.setup();
    render(<ConvertResult />);

    const copyButton = screen.getByRole('button', { name: /copyResult/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('copied')).toBeInTheDocument();
    });
  });

  it('should reset on new conversion click', async () => {
    const user = userEvent.setup();
    render(<ConvertResult />);

    const newButton = screen.getByRole('button', { name: /newConversion/i });
    await user.click(newButton);

    expect(mockReset).toHaveBeenCalled();
  });
});

describe('ConvertResult - no result', () => {
  beforeEach(() => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      result: null,
    });
  });

  it('should not render when result is null', () => {
    render(<ConvertResult />);

    expect(screen.queryByTestId('convert-result')).not.toBeInTheDocument();
  });
});

describe('ConvertResult - failed result', () => {
  beforeEach(() => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      result: { success: false, error: 'Failed' },
    });
  });

  it('should not render when result is not successful', () => {
    render(<ConvertResult />);

    expect(screen.queryByTestId('convert-result')).not.toBeInTheDocument();
  });
});

describe('ConvertResult - blob output', () => {
  const blobResult = {
    success: true,
    data: new Blob(['test'], { type: 'application/octet-stream' }),
    format: 'xlsx',
    metadata: {
      rowCount: 1,
      columnCount: 2,
      inputFormat: 'csv',
      outputFormat: 'xlsx',
    },
  };

  beforeEach(() => {
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      result: blobResult,
      outputFormat: 'xlsx',
    });
  });

  it('should not show copy button for blob output', () => {
    render(<ConvertResult />);

    expect(screen.queryByRole('button', { name: /copyResult/i })).not.toBeInTheDocument();
  });

  it('should still show download button for blob output', () => {
    render(<ConvertResult />);

    expect(screen.getByRole('button', { name: /downloadResult/i })).toBeInTheDocument();
  });
});
