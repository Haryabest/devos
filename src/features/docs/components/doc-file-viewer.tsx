import { useEffect, useMemo, useState } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichEditorBody, type RichEditorController } from '@/components/ui/rich-editor';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  DOC_FORMAT_LABELS,
  dataUrlToText,
  dataUrlToArrayBuffer,
  downloadDocFile,
  isEditableFormat,
} from '@/lib/doc-formats';
import type { Doc } from '@/shared/types';
import { ExcelSpreadsheetEditor } from '@/features/docs/components/excel-spreadsheet-editor';

interface DocFileViewerProps {
  doc: Doc;
  content: string;
  onContentChange: (content: string) => void;
  editor?: RichEditorController;
  className?: string;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\r') {
      /* skip */
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function CsvTable({ text }: { text: string }) {
  const rows = useMemo(() => parseCsvRows(text), [text]);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Пустой CSV</p>;
  const [head, ...body] = rows;
  return (
    <div className="overflow-auto rounded-md border border-border/60">
      <table className="w-full min-w-[320px] text-left text-xs">
        <thead className="bg-muted/40">
          <tr>
            {head?.map((c, i) => (
              <th key={i} className="border-b border-border/60 px-2 py-1.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className="border-b border-border/40 last:border-0">
              {r.map((c, ci) => (
                <td key={ci} className="px-2 py-1.5 text-muted-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocFileViewer({
  doc,
  content,
  onContentChange,
  editor,
  className,
}: DocFileViewerProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>(isEditableFormat(doc.format) ? 'edit' : 'preview');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [xlsxHtml, setXlsxHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMode(isEditableFormat(doc.format) ? 'edit' : 'preview');
    setDocxHtml(null);
    setXlsxHtml(null);
    setLoadError(null);
  }, [doc.id, doc.format]);

  useEffect(() => {
    if (doc.format !== 'docx' || !doc.fileData) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const bytes = dataUrlToArrayBuffer(doc.fileData);

    mammoth
      .convertToHtml({ arrayBuffer: bytes })
      .then((result) => {
        if (cancelled) return;
        setDocxHtml(result.value);
        if (!content.trim()) onContentChange(result.value);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не удалось открыть DOCX');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [doc.id, doc.format, doc.fileData]);

  useEffect(() => {
    if (doc.format !== 'xlsx' || !doc.fileData) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    try {
      const buf = dataUrlToArrayBuffer(doc.fileData);
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]!];
      if (!sheet) throw new Error('empty');
      const html = XLSX.utils.sheet_to_html(sheet);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (!cancelled) {
        setXlsxHtml(html);
        if (!content.trim()) onContentChange(csv);
      }
    } catch {
      if (!cancelled) setLoadError('Не удалось открыть XLSX');
    } finally {
      if (!cancelled) setLoading(false);
    }
  }, [doc.id, doc.format, doc.fileData]);

  useEffect(() => {
    if (doc.format !== 'txt' && doc.format !== 'md' && doc.format !== 'csv') return;
    if (content.trim() || !doc.fileData) return;
    onContentChange(dataUrlToText(doc.fileData));
  }, [doc.id, doc.format, doc.fileData]);

  const canDownload = Boolean(doc.fileData && doc.fileName);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
          {DOC_FORMAT_LABELS[doc.format]}
        </span>
        {doc.version > 1 && <span className="text-xs text-muted-foreground">v{doc.version}</span>}
        {isEditableFormat(doc.format) && (
          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              onClick={() => setMode('preview')}
            >
              Просмотр
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              onClick={() => setMode('edit')}
            >
              Редактирование
            </Button>
          </div>
        )}
        {canDownload && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadDocFile(doc.fileData!, doc.fileName!)}
          >
            <Icons.ExternalLink className="h-3.5 w-3.5" />
            Скачать
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.Loader2 className="h-4 w-4 animate-spin" />
          Загрузка файла…
        </div>
      )}
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {doc.format === 'page' && editor && (
        <RichEditorBody
          controller={editor}
          placeholder="Начните писать…"
          className="min-h-[calc(100vh-18rem)]"
        />
      )}

      {doc.format === 'pdf' && doc.fileData && (
        <iframe
          title={doc.title}
          src={doc.fileData}
          className="h-[calc(100vh-16rem)] w-full rounded-md border border-border/60 bg-muted/20"
        />
      )}

      {doc.format === 'image' && doc.fileData && (
        <div className="flex justify-start">
          <img
            src={doc.fileData}
            alt={doc.title}
            className="max-h-[calc(100vh-16rem)] max-w-full rounded-md border border-border/60 object-contain"
          />
        </div>
      )}

      {doc.format === 'docx' && mode === 'preview' && docxHtml && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border/60 bg-card p-6"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      )}

      {doc.format === 'docx' && mode === 'edit' && (
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[calc(100vh-18rem)] font-mono text-sm"
          placeholder="Текст документа…"
        />
      )}

      {doc.format === 'xlsx' && mode === 'preview' && xlsxHtml && (
        <div
          className="overflow-auto rounded-md border border-border/60 bg-card p-2 [&_table]:w-full [&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs [&_th]:border [&_th]:border-border/50 [&_th]:bg-muted/40 [&_th]:px-2 [&_th]:py-1 [&_th]:text-xs"
          dangerouslySetInnerHTML={{ __html: xlsxHtml }}
        />
      )}

      {doc.format === 'xlsx' && mode === 'edit' && (
        <ExcelSpreadsheetEditor
          csvContent={content}
          onChange={onContentChange}
          onSaveXlsx={(dataUrl) => {
            onContentChange(content);
            void import('@/stores/docs-store').then(({ useDocsStore }) => {
              const store = useDocsStore.getState();
              store.update(doc.id, { content });
              useDocsStore.setState((s) => ({
                docs: s.docs.map((d) => (d.id === doc.id ? { ...d, fileData: dataUrl } : d)),
              }));
            });
          }}
        />
      )}

      {(doc.format === 'txt' || doc.format === 'md') && mode === 'edit' && (
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[calc(100vh-18rem)] font-mono text-sm"
          placeholder={doc.format === 'md' ? '# Markdown…' : 'Текст…'}
        />
      )}

      {(doc.format === 'txt' || doc.format === 'md') && mode === 'preview' && (
        <pre className="min-h-[200px] whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-4 text-sm">
          {content}
        </pre>
      )}

      {doc.format === 'csv' && mode === 'edit' && (
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[calc(100vh-18rem)] font-mono text-sm"
          placeholder="col1,col2,col3"
        />
      )}

      {doc.format === 'csv' && mode === 'preview' && <CsvTable text={content} />}
    </div>
  );
}
