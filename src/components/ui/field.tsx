import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export function Field({
  className,
  ...props
}: React.ComponentProps<'div'> & { 'data-invalid'?: boolean }) {
  return (
    <div
      className={cn('space-y-2', 'group/field', className)}
      data-slot="field"
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn('group-data-[invalid=true]/field:text-destructive', className)}
      {...props}
    />
  );
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-xs text-muted-foreground group-data-[invalid=true]/field:text-destructive', className)}
      {...props}
    />
  );
}
