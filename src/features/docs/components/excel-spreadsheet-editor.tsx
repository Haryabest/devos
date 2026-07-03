import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExcelSpreadsheetEditorProps {
  csvContent: string;
  onChange: (csv: string) => void;
  onSaveXlsx?: (dataUrl: string) => void;
  className?: string;
}

function csvToMatrix(csv: string): string[][] {
  return csv.split('\n').map((line) => {
    const row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') inQuotes = false;
        else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r') continue;
      else cell += ch;
    }
    row.push(cell);
    return row;
  });
}

function matrixToCsv(matrix: string[][]): string {
  return matrix
    .map((row) =>
      row
        .map((c) => (c.includes(',') || c.includes('"') || c.includes('\n') ? `"${c.replace(/"/g, '""')}"` : c))
        .join(','),
    )
    .join('\n');
}

export function ExcelSpreadsheetEditor({
  csvContent,
  onChange,
  onSaveXlsx,
  className,
}: ExcelSpreadsheetEditorProps) {
  const matrix = useMemo(() => csvToMatrix(csvContent || ''), [csvContent]);
  const [local, setLocal] = useState(matrix);

  useEffect(() => {
    setLocal(matrix);
  }, [csvContent]);

  function updateCell(r: number, c: number, value: string) {
    const next = local.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : [...row]));
    if (r >= next.length) return;
    while (next[r]!.length <= c) next[r]!.push('');
    next[r]![c] = value;
    setLocal(next);
    onChange(matrixToCsv(next));
  }

  function addRow() {
    const cols = local[0]?.length ?? 1;
    const next = [...local, Array.from({ length: cols }, () => '')];
    setLocal(next);
    onChange(matrixToCsv(next));
  }

  function addCol() {
    const next = local.map((row) => [...row, '']);
    setLocal(next);
    onChange(matrixToCsv(next));
  }

  function exportXlsx() {
    const ws = XLSX.utils.aoa_to_sheet(local);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const bytes = new Uint8Array(buf);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${btoa(binary)}`;
    onSaveXlsx?.(dataUrl);
  }

  const colCount = Math.max(1, ...local.map((r) => r.length));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          + строка
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addCol}>
          + колонка
        </Button>
        {onSaveXlsx && (
          <Button type="button" size="sm" variant="secondary" onClick={exportXlsx}>
            Сохранить XLSX
          </Button>
        )}
      </div>
      <div className="overflow-auto rounded-md border border-border/60">
        <table className="w-full min-w-[480px] border-collapse text-xs">
          <tbody>
            {local.map((row, ri) => (
              <tr key={ri}>
                {Array.from({ length: colCount }, (_, ci) => (
                  <td key={ci} className="border border-border/50 p-0">
                    <input
                      value={row[ci] ?? ''}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-full min-w-[80px] bg-transparent px-2 py-1.5 outline-none focus:bg-muted/30"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
