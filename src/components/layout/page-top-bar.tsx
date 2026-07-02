import { cn } from '@/lib/utils';

export function PageTopBar({
  breadcrumb,
  children,
  className,
}: {
  breadcrumb?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-border/60 px-6 py-4', className)}>
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
      {children}
    </div>
  );
}
