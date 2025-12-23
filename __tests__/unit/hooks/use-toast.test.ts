import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

// Reset module state between tests
beforeEach(() => {
  vi.clearAllMocks();
});

describe('reducer', () => {
  const initialState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('should add a toast to the state', () => {
      const newToast = { id: '1', title: 'Test', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };

      const result = reducer(initialState, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it('should add new toast at the beginning', () => {
      const existingToast = { id: '1', title: 'First', open: true };
      const state = { toasts: [existingToast] };
      const newToast = { id: '2', title: 'Second', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };

      const result = reducer(state, action);

      expect(result.toasts[0].id).toBe('2');
    });

    it('should limit toasts to TOAST_LIMIT', () => {
      const existingToast = { id: '1', title: 'First', open: true };
      const state = { toasts: [existingToast] };
      const newToast = { id: '2', title: 'Second', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };

      const result = reducer(state, action);

      // TOAST_LIMIT is 1, so only the newest toast should remain
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('should update existing toast', () => {
      const existingToast = { id: '1', title: 'Original', open: true };
      const state = { toasts: [existingToast] };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].title).toBe('Updated');
      expect(result.toasts[0].open).toBe(true);
    });

    it('should not modify other toasts', () => {
      const toast1 = { id: '1', title: 'First', open: true };
      const toast2 = { id: '2', title: 'Second', open: true };
      const state = { toasts: [toast1, toast2] };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' },
      };

      const result = reducer(state, action);

      expect(result.toasts[1].title).toBe('Second');
    });

    it('should preserve existing properties', () => {
      const existingToast = { id: '1', title: 'Original', description: 'Desc', open: true };
      const state = { toasts: [existingToast] };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].description).toBe('Desc');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('should set open to false for specific toast', () => {
      const existingToast = { id: '1', title: 'Test', open: true };
      const state = { toasts: [existingToast] };
      const action = { type: 'DISMISS_TOAST' as const, toastId: '1' };

      const result = reducer(state, action);

      expect(result.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no id provided', () => {
      const toast1 = { id: '1', title: 'First', open: true };
      const toast2 = { id: '2', title: 'Second', open: true };
      const state = { toasts: [toast1, toast2] };
      const action = { type: 'DISMISS_TOAST' as const };

      const result = reducer(state, action);

      expect(result.toasts.every((t) => t.open === false)).toBe(true);
    });

    it('should not affect other toast open states', () => {
      const toast1 = { id: '1', title: 'First', open: true };
      const toast2 = { id: '2', title: 'Second', open: true };
      const state = { toasts: [toast1, toast2] };
      const action = { type: 'DISMISS_TOAST' as const, toastId: '1' };

      const result = reducer(state, action);

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('should remove specific toast', () => {
      const existingToast = { id: '1', title: 'Test', open: true };
      const state = { toasts: [existingToast] };
      const action = { type: 'REMOVE_TOAST' as const, toastId: '1' };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(0);
    });

    it('should remove all toasts when no id provided', () => {
      const toast1 = { id: '1', title: 'First', open: true };
      const toast2 = { id: '2', title: 'Second', open: true };
      const state = { toasts: [toast1, toast2] };
      const action = { type: 'REMOVE_TOAST' as const };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(0);
    });

    it('should only remove matching toast', () => {
      const toast1 = { id: '1', title: 'First', open: true };
      const toast2 = { id: '2', title: 'Second', open: true };
      const state = { toasts: [toast1, toast2] };
      const action = { type: 'REMOVE_TOAST' as const, toastId: '1' };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });
  });
});

describe('toast function', () => {
  it('should return id, dismiss, and update functions', () => {
    const result = toast({ title: 'Test' });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('dismiss');
    expect(result).toHaveProperty('update');
    expect(typeof result.id).toBe('string');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('should generate unique ids', () => {
    const toast1 = toast({ title: 'First' });
    const toast2 = toast({ title: 'Second' });

    expect(toast1.id).not.toBe(toast2.id);
  });
});

describe('useToast hook', () => {
  it('should return toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toBeDefined();
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('should return toast function', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeDefined();
    expect(typeof result.current.toast).toBe('function');
  });

  it('should return dismiss function', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.dismiss).toBeDefined();
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should add toast when toast is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts.length).toBeGreaterThan(0);
  });

  it('should update toasts when new toast is added', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'New Toast' });
    });

    // TOAST_LIMIT is 1, so there should be exactly 1 toast
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('New Toast');
  });

  it('should dismiss toast when dismiss is called', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const { id } = result.current.toast({ title: 'Test' });
      toastId = id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    const dismissedToast = result.current.toasts.find((t) => t.id === toastId);
    expect(dismissedToast?.open).toBe(false);
  });

  it('should dismiss all toasts when dismiss is called without id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every((t) => t.open === false)).toBe(true);
  });
});

describe('toast properties', () => {
  it('should include title in toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'My Title' });
    });

    expect(result.current.toasts[0].title).toBe('My Title');
  });

  it('should include description in toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Title', description: 'My Description' });
    });

    expect(result.current.toasts[0].description).toBe('My Description');
  });

  it('should set open to true for new toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test' });
    });

    expect(result.current.toasts[0].open).toBe(true);
  });

  it('should include action in toast', () => {
    const { result } = renderHook(() => useToast());
    const actionElement = { altText: 'Undo' };

    act(() => {
      // @ts-expect-error - simplified action for testing
      result.current.toast({ title: 'Test', action: actionElement });
    });

    expect(result.current.toasts[0].action).toEqual(actionElement);
  });
});
