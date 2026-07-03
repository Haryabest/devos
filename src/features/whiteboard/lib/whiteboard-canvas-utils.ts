import getStroke from 'perfect-freehand';
import { jsPDF } from 'jspdf';
import { downloadBlob } from '@/lib/download-utils';
import type {
  WhiteboardConnector,
  WhiteboardData,
  WhiteboardNote,
  WhiteboardPoint,
  WhiteboardShape,
  WhiteboardStroke,
  WhiteboardViewport,
} from '@/shared/types/whiteboard';
import { WHITEBOARD_NOTE_COLORS, WHITEBOARD_SHAPE_COLORS } from '@/shared/types/whiteboard';

export const CANVAS_W = 3200;
export const CANVAS_H = 2200;

export function simplifyStrokePoints(points: WhiteboardPoint[], width: number): WhiteboardPoint[] {
  if (points.length < 2) return points;
  const outline = getStroke(
    points.map((p) => [p.x, p.y] as [number, number]),
    { size: width * 2, thinning: 0.6, smoothing: 0.5, streamline: 0.4 },
  );
  return outline.map(([x, y]) => ({ x, y }));
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: WhiteboardPoint[],
  color: string,
  width: number,
) {
  if (points.length < 2) return;
  const outline = simplifyStrokePoints(points, width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outline[0]!.x, outline[0]!.y);
  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i]!.x, outline[i]!.y);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: WhiteboardShape) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 2.5;
  if (shape.kind === 'rect') {
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    return;
  }
  if (shape.kind === 'circle') {
    ctx.beginPath();
    ctx.ellipse(
      shape.x + shape.width / 2,
      shape.y + shape.height / 2,
      Math.abs(shape.width) / 2,
      Math.abs(shape.height) / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    return;
  }
  if (shape.kind === 'arrow') {
    const x1 = shape.x;
    const y1 = shape.y;
    const x2 = shape.x + shape.width;
    const y2 = shape.y + shape.height;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 14;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
}

export function getElementCenter(
  board: WhiteboardData,
  id: string,
): WhiteboardPoint | null {
  const note = board.notes.find((n) => n.id === id);
  if (note) return { x: note.x + note.width / 2, y: note.y + note.height / 2 };
  const shape = board.shapes.find((s) => s.id === id);
  if (shape) return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  return null;
}

export function drawConnector(
  ctx: CanvasRenderingContext2D,
  board: WhiteboardData,
  connector: WhiteboardConnector,
) {
  const from = getElementCenter(board, connector.fromId);
  const to = getElementCenter(board, connector.toId);
  if (!from || !to) return;
  ctx.strokeStyle = connector.color ?? '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 14;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

export function redrawBoard(
  ctx: CanvasRenderingContext2D,
  board: WhiteboardData,
  previewShape?: WhiteboardShape | null,
  previewStroke?: WhiteboardPoint[],
  penColor = '#6366f1',
) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  for (const stroke of board.strokes) {
    drawStroke(ctx, stroke.points, stroke.color, stroke.width);
  }
  for (const shape of board.shapes) {
    drawShape(ctx, shape);
  }
  if (previewShape) drawShape(ctx, previewShape);
  if (previewStroke && previewStroke.length > 1) {
    drawStroke(ctx, previewStroke, penColor, 2.5);
  }
}

export function exportBoardPng(board: WhiteboardData): string {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  redrawBoard(ctx, board);
  for (const note of board.notes) {
    ctx.fillStyle = note.color;
    ctx.fillRect(note.x, note.y, note.width, note.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.strokeRect(note.x, note.y, note.width, note.height);
    ctx.fillStyle = '#111';
    ctx.font = '14px system-ui,sans-serif';
    wrapText(ctx, note.text || 'Стикер', note.x + 8, note.y + 24, note.width - 16, 18);
  }
  for (const connector of board.connectors) {
    drawConnector(ctx, board, connector);
  }
  return canvas.toDataURL('image/png');
}

export function exportBoardPdf(board: WhiteboardData, filename = 'whiteboard.pdf') {
  const png = exportBoardPng(board);
  if (!png) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const imgRatio = CANVAS_W / CANVAS_H;
  let w = pageW - margin * 2;
  let h = w / imgRatio;
  if (h > pageH - margin * 2) {
    h = pageH - margin * 2;
    w = h * imgRatio;
  }
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  doc.addImage(png, 'PNG', x, y, w, h);
  downloadBlob(filename, doc.output('blob'));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

export function pickNoteColor(index: number) {
  return WHITEBOARD_NOTE_COLORS[index % WHITEBOARD_NOTE_COLORS.length]!;
}

export function pickShapeColor(index: number) {
  return WHITEBOARD_SHAPE_COLORS[index % WHITEBOARD_SHAPE_COLORS.length]!;
}

export type { WhiteboardData, WhiteboardViewport, WhiteboardShape, WhiteboardNote, WhiteboardConnector, WhiteboardStroke };
