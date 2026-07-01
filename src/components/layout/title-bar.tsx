import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Определяем — работаем внутри Tauri или в браузере */
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function winAction(action: 'minimize' | 'maximize' | 'close') {
  if (!isTauri) return;
  const win = getCurrentWindow();
  if (action === 'minimize') await win.minimize();
  if (action === 'maximize') await win.toggleMaximize();
  if (action === 'close') await win.close();
}

interface TitleBarProps {
  className?: string;
}

export function TitleBar({ className }: TitleBarProps) {
  if (!isTauri) return null;

  return (
    <div
      className={cn(
        'flex h-9 w-full select-none items-center border-b border-border/60 bg-card/60 backdrop-blur-sm',
        className,
      )}
      // Разрешаем перетаскивать окно за titlebar
      data-tauri-drag-region
    >
      {/* Логотип / название */}
      <div className="flex items-center gap-2 px-3" data-tauri-drag-region>
        <div className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground">
          <span className="text-[8px] font-bold leading-none">D</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">DevOS</span>
      </div>

      {/* Растягивается — область drag */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Кнопки управления окном */}
      <div className="flex items-center">
        <TitleBarBtn
          label="Свернуть"
          onClick={() => winAction('minimize')}
          className="hover:bg-accent"
        >
          <Minus className="h-3 w-3" />
        </TitleBarBtn>
        <TitleBarBtn
          label="Развернуть"
          onClick={() => winAction('maximize')}
          className="hover:bg-accent"
        >
          <Square className="h-3 w-3" />
        </TitleBarBtn>
        <TitleBarBtn
          label="Закрыть"
          onClick={() => winAction('close')}
          className="hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-3 w-3" />
        </TitleBarBtn>
      </div>
    </div>
  );
}

function TitleBarBtn({
  children,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors',
        className,
      )}
    >
      {children}
    </button>
  );
}
