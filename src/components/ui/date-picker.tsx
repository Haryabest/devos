import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { fromDateInputValue, toDateInputValue } from '@/lib/format-date';

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  invalid?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  className,
  id,
  invalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const iso = value ?? null;
  const selected = iso ? parseISO(iso) : undefined;
  const hasDate = !!(selected && isValid(selected));
  const label = hasDate && selected ? format(selected, 'd MMM yyyy', { locale: ru }) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent text-sm shadow-sm',
            'ring-offset-background transition-colors hover:bg-accent/30',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            invalid && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate px-3 text-left',
              !hasDate && 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          <span className="flex h-full w-9 shrink-0 items-center justify-center border-l border-input bg-muted/20">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[200] w-auto p-0"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={hasDate ? selected : undefined}
          defaultMonth={hasDate ? selected : undefined}
          onSelect={(date) => {
            onChange(date ? fromDateInputValue(format(date, 'yyyy-MM-dd')) : null);
            setOpen(false);
          }}
        />
        {iso && (
          <div className="border-t p-2">
            <button
              type="button"
              className="h-7 w-full rounded-md text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Очистить
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Для controlled string в формате yyyy-MM-dd (legacy inputs). */
export function DatePickerInput({
  value,
  onChange,
  ...rest
}: Omit<DatePickerProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (yyyyMmDd: string) => void;
}) {
  const iso = value ? fromDateInputValue(value) : null;
  return (
    <DatePicker
      {...rest}
      value={iso}
      onChange={(v) => onChange(v ? toDateInputValue(v) : '')}
    />
  );
}
