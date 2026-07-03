import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-transparent shadow-sm',
        'focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
      {...props}
    />
  );
}

export const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn('h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0', className)}
    {...props}
  />
));
InputGroupInput.displayName = 'InputGroupInput';

export function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & { align?: 'inline-start' | 'inline-end' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center',
        align === 'inline-end' ? 'border-l border-input pl-0' : 'border-r border-input pr-0',
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupButton({
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('h-9 rounded-none px-2.5', className)}
      {...props}
    />
  );
}
