import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ThemePreference } from '@/stores/settings-store';

type AppearanceSectionProps = {
  themePreference: ThemePreference;
  currentTheme: 'light' | 'dark';
  onThemeChange: (pref: ThemePreference) => void;
};

export function AppearanceSection({
  themePreference,
  currentTheme,
  onThemeChange,
}: AppearanceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Оформление</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Тема</Label>
          <Select value={themePreference} onValueChange={(v) => onThemeChange(v as ThemePreference)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Системная</SelectItem>
              <SelectItem value="light">Светлая</SelectItem>
              <SelectItem value="dark">Тёмная</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Текущая: {currentTheme === 'dark' ? 'тёмная' : 'светлая'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
