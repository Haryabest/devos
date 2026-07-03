import type { WhiteboardData } from '@/shared/types/whiteboard';
import { getElementCenter } from '@/features/whiteboard/lib/whiteboard-canvas-utils';
import { downloadTextFile } from '@/lib/download-utils';

export function exportBoardMermaid(board: WhiteboardData): string {
  const lines = ['flowchart LR'];
  const idMap = new Map<string, string>();
  let n = 0;
  const node = (id: string, label: string) => {
    if (!idMap.has(id)) {
      idMap.set(id, `N${n++}`);
      const safe = label.replace(/[\n"]/g, ' ').slice(0, 40);
      lines.push(`  ${idMap.get(id)!}["${safe || 'node'}"]`);
    }
    return idMap.get(id)!;
  };
  for (const note of board.notes) {
    node(note.id, note.text || 'note');
  }
  for (const shape of board.shapes) {
    node(shape.id, shape.kind);
  }
  for (const c of board.connectors) {
    const a = node(c.fromId, '');
    const b = node(c.toId, '');
    lines.push(`  ${a} --> ${b}`);
  }
  for (const shape of board.shapes.filter((s) => s.kind === 'arrow')) {
    lines.push(`  %% arrow ${shape.x},${shape.y}`);
  }
  return lines.join('\n');
}

export function exportBoardPlantUml(board: WhiteboardData): string {
  const lines = ['@startuml', 'skinparam componentStyle rectangle'];
  const idMap = new Map<string, string>();
  let n = 0;
  const pid = (id: string) => {
    if (!idMap.has(id)) idMap.set(id, `C${n++}`);
    return idMap.get(id)!;
  };
  for (const note of board.notes) {
    const label = (note.text || 'note').replace(/[\n"]/g, ' ').slice(0, 40);
    lines.push(`component "${label}" as ${pid(note.id)}`);
  }
  for (const shape of board.shapes) {
    lines.push(`component "${shape.kind}" as ${pid(shape.id)}`);
  }
  for (const c of board.connectors) {
    lines.push(`${pid(c.fromId)} --> ${pid(c.toId)}`);
  }
  lines.push('@enduml');
  return lines.join('\n');
}

export function downloadText(filename: string, text: string) {
  downloadTextFile(filename, text);
}

export function centerOfBoard(board: WhiteboardData, id: string) {
  return getElementCenter(board, id);
}
