import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { fromDateInputValue, toDateInputValue } from '@/lib/format-date';

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  className,
  id,
}: DatePickerProps) {
  const iso = value ?? null;
  const selected = iso ? parseISO(iso) : undefined;
  const label =
    selected && isValid(selected) ? format(selected, 'd MMM yyyy', { locale: ru }) : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'h-9 w-full justify-start text-left font-normal',
            !iso && 'text-muted-foreground',
            className,
          )}
        >
          <Icons.CircleDashed className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected && isValid(selected) ? selected : undefined}
          onSelect={(d) => {
            onChange(d ? fromDateInputValue(format(d, 'yyyy-MM-dd')) : null);
          }}
        />
        {iso && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => onChange(null)}
            >
              Очистить
            </Button>
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
