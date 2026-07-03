export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  points: WhiteboardPoint[];
  color: string;
  width: number;
}

export interface WhiteboardNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  groupId?: string | null;
}

export type WhiteboardShapeKind = 'rect' | 'circle' | 'arrow';

export interface WhiteboardShape {
  id: string;
  kind: WhiteboardShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  groupId?: string | null;
}

export interface WhiteboardConnector {
  id: string;
  fromId: string;
  toId: string;
  color: string;
}

export interface WhiteboardViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface WhiteboardData {
  projectId: string;
  strokes: WhiteboardStroke[];
  notes: WhiteboardNote[];
  shapes: WhiteboardShape[];
  connectors: WhiteboardConnector[];
  groups: WhiteboardGroup[];
  viewport: WhiteboardViewport;
}

export const WHITEBOARD_NOTE_COLORS = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#e9d5ff',
] as const;

export const WHITEBOARD_SHAPE_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
] as const;

export type WhiteboardTool =
  | 'select'
  | 'pen'
  | 'note'
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'connector'
  | 'hand'
  | 'laser'
  | 'comment';

export interface WhiteboardGroup {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_VIEWPORT: WhiteboardViewport = { zoom: 1, panX: 0, panY: 0 };

export function emptyBoard(projectId: string): WhiteboardData {
  return {
    projectId,
    strokes: [],
    notes: [],
    shapes: [],
    connectors: [],
    groups: [],
    viewport: { ...DEFAULT_VIEWPORT },
  };
}

export function normalizeBoard(data: Partial<WhiteboardData> & { projectId: string }): WhiteboardData {
  return {
    projectId: data.projectId,
    strokes: data.strokes ?? [],
    notes: data.notes ?? [],
    shapes: data.shapes ?? [],
    connectors: data.connectors ?? [],
    groups: data.groups ?? [],
    viewport: data.viewport ?? { ...DEFAULT_VIEWPORT },
  };
}
