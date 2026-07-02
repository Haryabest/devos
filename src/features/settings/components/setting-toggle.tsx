import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type SettingToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

export function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 pr-4">
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
