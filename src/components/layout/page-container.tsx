import { cn } from '@/lib/utils';

/**
 * Обёртка страницы. По умолчанию — на всю ширину main-области (без пустых полей по бокам).
 * `narrow` / `prose` — для форм и текстовых экранов с ограниченной шириной строки.
 */
export function PageContainer({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'wide' | 'prose' | 'narrow';
}) {
  return (
    <div
      className={cn(
        'w-full px-6 py-6',
        variant === 'default' && 'space-y-6',
        variant === 'wide' && 'space-y-6 px-8',
        variant === 'prose' && 'mx-auto max-w-4xl space-y-6',
        variant === 'narrow' && 'mx-auto max-w-3xl space-y-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
