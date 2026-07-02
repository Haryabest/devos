import { useCallback, useEffect, useRef, useState } from 'react';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type Command =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'formatBlock'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink'
  | 'insertImage'
  | 'removeFormat';

export interface RichEditorController {
  ref: React.RefObject<HTMLDivElement>;
  exec: (command: Command, arg?: string) => void;
  insertLink: () => void;
  insertImageFromUrl: () => void;
  insertImageFromFile: (file: File) => void;
  active: Record<string, boolean>;
  /** Props to spread onto the contentEditable body element. */
  bodyProps: {
    ref: React.RefObject<HTMLDivElement>;
    onInput: () => void;
    onKeyUp: () => void;
    onMouseUp: () => void;
    onFocus: () => void;
    onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  };
}

/**
 * Хук-контроллер WYSIWYG-редактора на contentEditable + execCommand.
 * Позволяет разместить тулбар и полотно редактора в разных местах layout'а.
 */
export function useRichEditor(
  value: string,
  onChange: (html: string) => void,
  /** Меняется при смене документа/задачи — тогда подставляем value в DOM. */
  documentKey?: string,
): RichEditorController {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const loadedKey = useRef<string | undefined>(undefined);

  // Подставляем HTML только при смене документа — не при autosave (иначе лаг).
  useEffect(() => {
    if (documentKey === loadedKey.current) return;
    loadedKey.current = documentKey;
    const el = ref.current;
    if (!el) return;
    el.innerHTML = value ?? '';
    updatePlaceholder();
  }, [documentKey, value]);

  const syncToolbar = useCallback(() => {
    try {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      /* queryCommandState может бросать — игнорируем */
    }
  }, []);

  const emitChange = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    onChange(el.innerHTML);
    updatePlaceholder();
  }, [onChange]);

  function updatePlaceholder() {
    const el = ref.current;
    if (!el) return;
    const isEmpty = !el.textContent || el.textContent.trim() === '';
    el.dataset.empty = isEmpty ? 'true' : 'false';
  }

  const exec = useCallback(
    (command: Command, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      syncToolbar();
      emitChange();
    },
    [emitChange, syncToolbar],
  );

  const insertLink = useCallback(() => {
    const url = window.prompt('Вставьте ссылку');
    if (url) exec('createLink', url);
  }, [exec]);

  const insertImageFromUrl = useCallback(() => {
    const url = window.prompt('Вставьте URL изображения');
    if (url) exec('insertImage', url);
  }, [exec]);

  const insertImageFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? '');
        if (dataUrl) exec('insertImage', dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [exec],
  );

  // Вставка изображения из буфера (скриншот).
  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            insertImageFromFile(file);
            return;
          }
        }
      }
    },
    [insertImageFromFile],
  );

  // Перетаскивание изображения в редактор.
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        insertImageFromFile(file);
      }
    },
    [insertImageFromFile],
  );

  return {
    ref,
    exec,
    insertLink,
    insertImageFromUrl,
    insertImageFromFile,
    active,
    bodyProps: {
      ref,
      onInput: emitChange,
      onKeyUp: syncToolbar,
      onMouseUp: syncToolbar,
      onFocus: updatePlaceholder,
      onPaste,
      onDrop,
    },
  };
}

/** Тулбар форматирования — размещается рядом с заголовком секции. */
export function RichEditorToolbar({
  controller,
  className,
  disabled,
}: {
  controller: RichEditorController;
  className?: string;
  disabled?: boolean;
}) {
  const { exec, insertLink, insertImageFromUrl, insertImageFromFile, active } = controller;
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <ToolButton onClick={() => exec('bold')} active={active.bold} title="Жирный (Ctrl+B)">
        <Icons.Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('italic')} active={active.italic} title="Курсив (Ctrl+I)">
        <Icons.Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('underline')} active={active.underline} title="Подчёркнутый (Ctrl+U)">
        <Icons.Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('strikeThrough')} active={active.strikeThrough} title="Зачёркнутый">
        <Icons.Strikethrough className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton onClick={() => exec('formatBlock', '<h1>')} title="Заголовок 1">
        <Icons.Heading1 className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('formatBlock', '<h2>')} title="Заголовок 2">
        <Icons.Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('formatBlock', '<p>')} title="Обычный текст">
        <span className="text-xs font-semibold">P</span>
      </ToolButton>
      <Divider />
      <ToolButton
        onClick={() => exec('insertUnorderedList')}
        active={active.insertUnorderedList}
        title="Маркированный список"
      >
        <Icons.List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => exec('insertOrderedList')}
        active={active.insertOrderedList}
        title="Нумерованный список"
      >
        <Icons.ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('formatBlock', '<blockquote>')} title="Цитата">
        <Icons.Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => exec('formatBlock', '<pre>')} title="Код (блок)">
        <Icons.Code className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton onClick={insertLink} title="Ссылка">
        <Icons.Link2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={insertImageFromUrl} title="Изображение по ссылке">
        <Icons.ImageIcon className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={() => fileInput.current?.click()} title="Загрузить изображение">
        <Icons.Plus className="h-4 w-4" />
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertImageFromFile(f);
          e.target.value = '';
        }}
      />
      <ToolButton onClick={() => exec('removeFormat')} title="Очистить форматирование">
        <span className="text-xs font-semibold leading-none">T×</span>
      </ToolButton>
    </div>
  );
}

/** Полотно редактора (contentEditable) — размещается ниже. */
export function RichEditorBody({
  controller,
  placeholder = 'Начните писать…',
  className,
}: {
  controller: RichEditorController;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      {...controller.bodyProps}
      contentEditable
      suppressContentEditableWarning
      data-empty="true"
      data-placeholder={placeholder}
      className={cn(
        'rich-editor min-h-[50vh] max-w-none px-4 py-3 text-sm leading-relaxed outline-none',
        className,
      )}
    />
  );
}

function ToolButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded px-1.5 text-foreground/80 transition-colors hover:bg-accent',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border/60" />;
}
