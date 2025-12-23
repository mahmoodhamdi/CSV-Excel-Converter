import { useEffect, useRef } from 'react';

/**
 * Hook to save and restore focus when a modal/dialog opens and closes.
 * When isOpen becomes true, saves the currently focused element.
 * When isOpen becomes false, restores focus to that element.
 */
export function useFocusReturn(isOpen: boolean): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      // Restore focus when closing
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);
}

/**
 * Hook to focus a specific element when a condition becomes true.
 */
export function useFocusOnMount<T extends HTMLElement>(
  shouldFocus: boolean
): React.RefObject<T> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}
