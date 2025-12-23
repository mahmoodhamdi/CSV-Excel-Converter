import * as React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(showLabel && 'gap-2', className)}
        aria-label={!showLabel ? label : undefined}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        {showLabel ? (
          <span>{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
export type { IconButtonProps };
