import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '@/components/converter/FileUpload';
import { useConverterStore } from '@/stores/converter-store';

// Mock the store
const mockSetInputData = vi.fn();
const mockSetInputFormat = vi.fn();
const mockSetParsedData = vi.fn();
const mockSetIsParsing = vi.fn();
const mockSetParseError = vi.fn();

vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the converter functions
vi.mock('@/lib/converter', () => ({
  parseData: vi.fn().mockResolvedValue({
    headers: ['name', 'age'],
    rows: [{ name: 'John', age: 30 }],
    format: 'csv',
    metadata: { rowCount: 1, columnCount: 2 },
  }),
  detectFormat: vi.fn().mockReturnValue('csv'),
  detectFormatFromFilename: vi.fn().mockReturnValue('csv'),
}));

const defaultStoreState = {
  setInputData: mockSetInputData,
  setInputFormat: mockSetInputFormat,
  setParsedData: mockSetParsedData,
  setIsParsing: mockSetIsParsing,
  setParseError: mockSetParseError,
  fileName: null,
  fileSize: null,
  isParsing: false,
  parseError: null,
};

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue(defaultStoreState);
  });

  it('should render upload dropzone', () => {
    render(<FileUpload />);

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<FileUpload />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should render browse text in dropzone', () => {
    render(<FileUpload />);

    // Browse is a visual element (span styled as button) inside the dropzone for accessibility
    expect(screen.getByText('browse')).toBeInTheDocument();
  });

  it('should render paste textarea', () => {
    render(<FileUpload />);

    expect(screen.getByTestId('paste-input')).toBeInTheDocument();
  });

  it('should render sample data button', () => {
    render(<FileUpload />);

    expect(screen.getByRole('button', { name: 'sampleData' })).toBeInTheDocument();
  });

  it('should handle file drop', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('upload-dropzone');
    const file = new File(['name,age\nJohn,30'], 'test.csv', { type: 'text/csv' });

    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });

    // File drop triggers the parsing flow
    await waitFor(() => {
      expect(mockSetIsParsing).toHaveBeenCalled();
    });
  });

  it('should show dragging state', () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('upload-dropzone');

    fireEvent.dragOver(dropzone);

    expect(dropzone).toHaveClass('active');
  });

  it('should remove dragging state on leave', () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('upload-dropzone');

    fireEvent.dragOver(dropzone);
    fireEvent.dragLeave(dropzone);

    expect(dropzone).not.toHaveClass('active');
  });

  it('should handle paste input', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const pasteInput = screen.getByTestId('paste-input');
    await user.type(pasteInput, 'name,age\nJohn,30');

    expect(pasteInput).toHaveValue('name,age\nJohn,30');
  });

  it('should trigger paste action on button click', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const pasteInput = screen.getByTestId('paste-input');
    await user.type(pasteInput, 'name,age\nJohn,30');

    const pasteButton = screen.getByRole('button', { name: 'paste' });
    await user.click(pasteButton);

    await waitFor(() => {
      expect(mockSetIsParsing).toHaveBeenCalledWith(true);
    });
  });

  it('should disable paste button when input is empty', () => {
    render(<FileUpload />);

    const pasteButton = screen.getByRole('button', { name: 'paste' });
    expect(pasteButton).toBeDisabled();
  });

  it('should load sample data on click', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const sampleButton = screen.getByRole('button', { name: 'sampleData' });
    await user.click(sampleButton);

    await waitFor(() => {
      expect(mockSetInputData).toHaveBeenCalled();
    });
  });

  it('should have visually hidden file input for accessibility', () => {
    render(<FileUpload />);

    const fileInput = document.getElementById('file-input');
    expect(fileInput).toBeInTheDocument();
    // File input uses sr-only class for accessibility (screen-reader-only)
    expect(fileInput).toHaveClass('sr-only');
  });

  it('should accept correct file types', () => {
    render(<FileUpload />);

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    expect(fileInput.accept).toBe('.csv,.tsv,.json,.xlsx,.xls,.xml');
  });
});

describe('FileUpload - with file selected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      fileName: 'test.csv',
      fileSize: 1024,
    });
  });

  it('should show file name when file is selected', () => {
    render(<FileUpload />);

    expect(screen.getByText('test.csv')).toBeInTheDocument();
  });

  it('should show clear button when file is selected', () => {
    render(<FileUpload />);

    // Clear button should be visible
    const clearButtons = screen.getAllByRole('button');
    const clearButton = clearButtons.find(btn => btn.querySelector('svg'));
    expect(clearButton).toBeInTheDocument();
  });
});

describe('FileUpload - parsing state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      isParsing: true,
    });
  });

  it('should show loading state while parsing', () => {
    render(<FileUpload />);

    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('should disable dropzone while parsing', () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('upload-dropzone');
    expect(dropzone).toHaveClass('pointer-events-none');
  });
});

describe('FileUpload - error state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConverterStore).mockReturnValue({
      ...defaultStoreState,
      parseError: 'Failed to parse file',
    });
  });

  it('should display parse error', () => {
    render(<FileUpload />);

    expect(screen.getByText('Failed to parse file')).toBeInTheDocument();
  });
});
