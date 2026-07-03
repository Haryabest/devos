import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string | null;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  const invalid = !!error;
  return (
    <Field data-invalid={invalid || undefined} className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? (
        <FieldDescription>{error}</FieldDescription>
      ) : description ? (
        <FieldDescription className={cn(!invalid && 'text-muted-foreground')}>
          {description}
        </FieldDescription>
      ) : null}
    </Field>
  );
}
