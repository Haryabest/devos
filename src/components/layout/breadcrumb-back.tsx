import { useNavigate } from 'react-router-dom';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface BreadcrumbBackProps {
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export function BreadcrumbBack({ label, to, onClick, className }: BreadcrumbBackProps) {
  const navigate = useNavigate();

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (to) navigate(to);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <Icons.ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
