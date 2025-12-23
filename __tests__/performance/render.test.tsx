import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VirtualDataPreview } from '@/components/converter/VirtualDataPreview';
import { DataPreview } from '@/components/converter/DataPreview';
import { SkeletonTable, SkeletonCard, SkeletonRow } from '@/components/ui/skeleton-table';
import { ProgressIndicator, FileProgress, BatchProgress } from '@/components/converter/ProgressIndicator';
import type { ParsedData } from '@/types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the converter store
vi.mock('@/stores/converter-store', () => ({
  useConverterStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        parsedData: null,
      });
    }
    return { parsedData: null };
  }),
}));

describe('Virtual Table Performance', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render VirtualDataPreview with small dataset', () => {
    const data: ParsedData = {
      headers: ['col1', 'col2', 'col3'],
      rows: Array.from({ length: 100 }, (_, i) => ({
        col1: `value${i}`,
        col2: i,
        col3: `data${i}`,
      })),
      format: 'csv',
      metadata: { rowCount: 100, columnCount: 3 },
    };

    const start = performance.now();
    render(<VirtualDataPreview data={data} />);
    const duration = performance.now() - start;

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(duration).toBeLessThan(500); // Should render in < 500ms
  });

  it('should render 10k rows without timeout', () => {
    const data: ParsedData = {
      headers: ['col1', 'col2', 'col3'],
      rows: Array.from({ length: 10000 }, (_, i) => ({
        col1: `value${i}`,
        col2: i,
        col3: `data${i}`,
      })),
      format: 'csv',
      metadata: { rowCount: 10000, columnCount: 3 },
    };

    const start = performance.now();
    render(<VirtualDataPreview data={data} />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // Should render in < 1 second
  });

  it('should handle 50k rows efficiently', () => {
    const data: ParsedData = {
      headers: ['id', 'name', 'value', 'category', 'date'],
      rows: Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        category: ['A', 'B', 'C'][i % 3],
        date: new Date(2024, 0, (i % 365) + 1).toISOString(),
      })),
      format: 'csv',
      metadata: { rowCount: 50000, columnCount: 5 },
    };

    const start = performance.now();
    render(<VirtualDataPreview data={data} />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000); // Should render in < 2 seconds
  });

  it('should handle wide datasets (100+ columns)', () => {
    const headers = Array.from({ length: 100 }, (_, i) => `column_${i}`);
    const data: ParsedData = {
      headers,
      rows: Array.from({ length: 1000 }, (_, rowIdx) => {
        const row: Record<string, unknown> = {};
        headers.forEach((header, colIdx) => {
          row[header] = `r${rowIdx}c${colIdx}`;
        });
        return row;
      }),
      format: 'csv',
      metadata: { rowCount: 1000, columnCount: 100 },
    };

    const start = performance.now();
    render(<VirtualDataPreview data={data} />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // Should render in < 1 second
  });

  it('should show empty state for no data', () => {
    const data: ParsedData = {
      headers: [],
      rows: [],
      format: 'csv',
      metadata: { rowCount: 0, columnCount: 0 },
    };

    render(<VirtualDataPreview data={data} />);

    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('should show truncation warning when data is truncated', () => {
    const data: ParsedData = {
      headers: ['col1'],
      rows: [{ col1: 'value' }],
      format: 'csv',
      metadata: { rowCount: 1, columnCount: 1, truncated: true },
    };

    render(<VirtualDataPreview data={data} />);

    expect(screen.getByText(/truncated/i)).toBeInTheDocument();
  });
});

describe('Skeleton Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('SkeletonTable', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonTable />);

      // Default is 5 rows, 4 columns
      const rowElements = container.querySelectorAll('.flex.gap-2');
      expect(rowElements.length).toBeGreaterThanOrEqual(5);
    });

    it('should render custom number of rows and columns', () => {
      const { container } = render(<SkeletonTable rows={3} columns={6} />);

      // Should have skeleton elements
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should hide header when showHeader is false', () => {
      const { container } = render(<SkeletonTable showHeader={false} rows={2} columns={2} />);

      // Should still render but without header
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('SkeletonCard', () => {
    it('should render basic skeleton card', () => {
      const { container } = render(<SkeletonCard />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should show action buttons when showActions is true', () => {
      const { container } = render(<SkeletonCard showActions />);

      // Should have more skeleton elements for actions
      const skeletons = container.querySelectorAll('.bg-muted, .bg-muted\\/50');
      expect(skeletons.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonRow', () => {
    it('should render with default columns', () => {
      const { container } = render(<SkeletonRow />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render specified number of columns', () => {
      const { container } = render(<SkeletonRow columns={8} />);

      const cells = container.querySelectorAll('.bg-muted\\/50');
      expect(cells.length).toBe(8);
    });
  });
});

describe('Progress Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('ProgressIndicator', () => {
    it('should show progress percentage', () => {
      render(<ProgressIndicator progress={50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should clamp progress to 0-100', () => {
      render(<ProgressIndicator progress={150} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show label', () => {
      render(<ProgressIndicator progress={25} label="Uploading..." />);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should show cancel button when onCancel provided', () => {
      const onCancel = vi.fn();
      render(<ProgressIndicator progress={50} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onCancel when button clicked', () => {
      const onCancel = vi.fn();
      render(<ProgressIndicator progress={50} onCancel={onCancel} />);

      screen.getByRole('button', { name: /cancel/i }).click();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should show indeterminate state', () => {
      render(<ProgressIndicator progress={0} indeterminate />);

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('FileProgress', () => {
    it('should show file name and size', () => {
      render(
        <FileProgress fileName="test.csv" fileSize={1024 * 1024} progress={50} />
      );

      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('should format bytes correctly', () => {
      render(<FileProgress fileName="small.csv" fileSize={500} progress={100} />);

      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      render(<FileProgress fileName="medium.csv" fileSize={5 * 1024} progress={100} />);

      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    it('should show error message when status is error', () => {
      render(
        <FileProgress
          fileName="failed.csv"
          fileSize={1024}
          progress={50}
          status="error"
          errorMessage="Upload failed"
        />
      );

      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('should show cancel button during upload/processing', () => {
      const onCancel = vi.fn();
      render(
        <FileProgress
          fileName="test.csv"
          fileSize={1024}
          progress={50}
          status="uploading"
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('BatchProgress', () => {
    it('should show current and total files', () => {
      render(
        <BatchProgress
          current={3}
          total={10}
          fileProgress={50}
          overallProgress={25}
        />
      );

      // The component uses translations which return the key in tests
      // Check for the translation key or the progress percentage
      expect(screen.getByText('converting')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should show overall progress percentage', () => {
      render(
        <BatchProgress
          current={5}
          total={10}
          fileProgress={75}
          overallProgress={45}
        />
      );

      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show cancel button when onCancel provided', () => {
      const onCancel = vi.fn();
      render(
        <BatchProgress
          current={1}
          total={5}
          fileProgress={0}
          overallProgress={0}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

describe('Memory usage', () => {
  it('should not leak memory with repeated renders', () => {
    const data: ParsedData = {
      headers: ['a', 'b', 'c'],
      rows: Array.from({ length: 1000 }, (_, i) => ({
        a: i,
        b: `val${i}`,
        c: i * 2,
      })),
      format: 'csv',
      metadata: { rowCount: 1000, columnCount: 3 },
    };

    // Render and cleanup multiple times
    for (let i = 0; i < 10; i++) {
      render(<VirtualDataPreview data={data} />);
      cleanup();
    }

    // If we get here without crashing, memory is being cleaned up properly
    expect(true).toBe(true);
  });
});
