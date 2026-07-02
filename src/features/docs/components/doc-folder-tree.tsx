import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { DOC_FORMAT_LABELS } from '@/lib/doc-formats';
import type { Doc, DocFolder } from '@/shared/types';

interface DocFolderTreeProps {
  folders: DocFolder[];
  docs: Doc[];
  activeId: string | null;
  onSelectDoc: (id: string) => void;
  onCreatePage: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onUpload: (folderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRemoveFolder: (id: string) => void;
  onRemoveDoc: (id: string, title: string) => void;
}

function DocIcon({ doc }: { doc: Doc }) {
  if (doc.format === 'pdf') return <Icons.FileText className="h-3.5 w-3.5 shrink-0 text-red-500/80" />;
  if (doc.format === 'image') return <Icons.ImageIcon className="h-3.5 w-3.5 shrink-0 text-sky-500/80" />;
  if (doc.format === 'xlsx' || doc.format === 'csv') {
    return <Icons.Table2 className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" />;
  }
  return <Icons.FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

function FolderNode({
  folder,
  depth,
  folders,
  docs,
  activeId,
  expanded,
  onToggle,
  onSelectDoc,
  onCreatePage,
  onCreateFolder,
  onUpload,
  onRenameFolder,
  onRemoveFolder,
  onRemoveDoc,
}: {
  folder: DocFolder;
  depth: number;
  folders: DocFolder[];
  docs: Doc[];
  activeId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelectDoc: (id: string) => void;
  onCreatePage: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onUpload: (folderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRemoveFolder: (id: string) => void;
  onRemoveDoc: (id: string, title: string) => void;
}) {
  const isOpen = expanded.has(folder.id);
  const childFolders = folders.filter((f) => f.parentId === folder.id);
  const folderDocs = docs.filter((d) => d.folderId === folder.id);

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-md py-0.5 pr-1 hover:bg-accent/60"
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <button
          type="button"
          onClick={() => onToggle(folder.id)}
          className="flex h-6 w-5 shrink-0 items-center justify-center text-muted-foreground"
        >
          <Icons.ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')} />
        </button>
        <button
          type="button"
          onDoubleClick={() => {
            const next = window.prompt('Название папки', folder.name);
            if (next?.trim()) onRenameFolder(folder.id, next.trim());
          }}
          onClick={() => onToggle(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm"
        >
          {isOpen ? (
            <Icons.FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/90" />
          ) : (
            <Icons.Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/90" />
          )}
          <span className="truncate">{folder.name}</span>
        </button>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Загрузить файл"
            onClick={() => onUpload(folder.id)}
          >
            <Icons.Upload className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Новая страница"
            onClick={() => onCreatePage(folder.id)}
          >
            <Icons.Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            aria-label="Удалить папку"
            onClick={() => onRemoveFolder(folder.id)}
          >
            <Icons.Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <>
          {folderDocs.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              depth={depth + 1}
              active={activeId === d.id}
              onSelect={() => onSelectDoc(d.id)}
              onRemove={() => onRemoveDoc(d.id, d.title)}
            />
          ))}
          {childFolders.map((f) => (
            <FolderNode
              key={f.id}
              folder={f}
              depth={depth + 1}
              folders={folders}
              docs={docs}
              activeId={activeId}
              expanded={expanded}
              onToggle={onToggle}
              onSelectDoc={onSelectDoc}
              onCreatePage={onCreatePage}
              onCreateFolder={onCreateFolder}
              onUpload={onUpload}
              onRenameFolder={onRenameFolder}
              onRemoveFolder={onRemoveFolder}
              onRemoveDoc={onRemoveDoc}
            />
          ))}
        </>
      )}
    </div>
  );
}

function DocRow({
  doc,
  depth,
  active,
  onSelect,
  onRemove,
}: {
  doc: Doc;
  depth: number;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md py-0.5 pr-1',
        active ? 'bg-accent' : 'hover:bg-accent/60',
      )}
      style={{ paddingLeft: depth * 12 + 24 }}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm">
        <DocIcon doc={doc} />
        <span className="truncate">{doc.title || 'Без названия'}</span>
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{DOC_FORMAT_LABELS[doc.format]}</span>
      </button>
      <button
        type="button"
        aria-label="Удалить"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

export function DocFolderTree({
  folders,
  docs,
  activeId,
  onSelectDoc,
  onCreatePage,
  onCreateFolder,
  onUpload,
  onRenameFolder,
  onRemoveFolder,
  onRemoveDoc,
}: DocFolderTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(folders.map((f) => f.id)));
  const [filter, setFilter] = useState('');

  const rootFolders = useMemo(() => folders.filter((f) => !f.parentId), [folders]);
  const rootDocs = useMemo(() => docs.filter((d) => !d.folderId), [docs]);

  const q = filter.trim().toLowerCase();
  const filteredDocs = q
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          DOC_FORMAT_LABELS[d.format].toLowerCase().includes(q),
      )
    : null;

  function toggleFolder(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (filteredDocs) {
    return (
      <div className="flex h-full flex-col">
        <div className="px-2 pb-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Поиск…"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex-1 overflow-auto px-1 pb-2">
          {filteredDocs.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">Ничего не найдено</p>
          ) : (
            filteredDocs.map((d) => (
              <DocRow
                key={d.id}
                doc={d}
                depth={0}
                active={activeId === d.id}
                onSelect={() => onSelectDoc(d.id)}
                onRemove={() => onRemoveDoc(d.id, d.title)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pb-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Поиск…"
          className="h-8 text-xs"
        />
      </div>
      <div className="flex-1 overflow-auto px-1 pb-2">
        {rootDocs.map((d) => (
          <DocRow
            key={d.id}
            doc={d}
            depth={0}
            active={activeId === d.id}
            onSelect={() => onSelectDoc(d.id)}
            onRemove={() => onRemoveDoc(d.id, d.title)}
          />
        ))}
        {rootFolders.map((f) => (
          <FolderNode
            key={f.id}
            folder={f}
            depth={0}
            folders={folders}
            docs={docs}
            activeId={activeId}
            expanded={expanded}
            onToggle={toggleFolder}
            onSelectDoc={onSelectDoc}
            onCreatePage={onCreatePage}
            onCreateFolder={onCreateFolder}
            onUpload={onUpload}
            onRenameFolder={onRenameFolder}
            onRemoveFolder={onRemoveFolder}
            onRemoveDoc={onRemoveDoc}
          />
        ))}
        {rootDocs.length === 0 && rootFolders.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">Создайте страницу, папку или загрузите файл.</p>
        )}
      </div>
    </div>
  );
}
