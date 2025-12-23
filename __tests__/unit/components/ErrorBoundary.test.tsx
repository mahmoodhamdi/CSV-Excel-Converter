import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, ErrorFallback } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Component rendered successfully</div>;
};

// Suppress console.error during tests
const originalError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    cleanup();
  });

  describe('Normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An error occurred while rendering/)).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Recovery', () => {
    it('should reset error state when Try again is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Click try again button
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Component should re-render after reset
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should show Try again button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should show Go to Home button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
  });

  describe('Error display', () => {
    it('should display error boundary card UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Check that the error UI is displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    cleanup();
  });

  it('should wrap component with ErrorBoundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent);

    render(<WrappedComponent shouldThrow={true} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should use custom fallback', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent, <div>Custom fallback</div>);

    render(<WrappedComponent shouldThrow={true} />);
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('should set displayName on wrapped component', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should use component name if displayName is not set', () => {
    function NamedComponent() {
      return <div>Test</div>;
    }

    const WrappedComponent = withErrorBoundary(NamedComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(NamedComponent)');
  });
});

describe('ErrorFallback', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render fallback message', () => {
    render(<ErrorFallback />);
    expect(screen.getByText('Failed to load this section')).toBeInTheDocument();
  });

  it('should show retry button when resetErrorBoundary is provided', () => {
    const resetFn = vi.fn();
    render(<ErrorFallback resetErrorBoundary={resetFn} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when resetErrorBoundary is not provided', () => {
    render(<ErrorFallback />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should render error fallback with error prop', () => {
    render(<ErrorFallback error={new Error('Test error')} />);
    expect(screen.getByText('Failed to load this section')).toBeInTheDocument();
  });

  it('should render with both error and resetErrorBoundary', () => {
    const resetFn = vi.fn();
    render(<ErrorFallback error={new Error('Test error')} resetErrorBoundary={resetFn} />);

    expect(screen.getByText('Failed to load this section')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
