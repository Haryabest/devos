import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ru}
      className={cn('p-3', className)}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
