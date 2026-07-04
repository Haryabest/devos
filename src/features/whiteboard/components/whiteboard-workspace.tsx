import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { downloadDataUrl } from '@/lib/download-utils';
import { useWhiteboardStore } from '@/stores/whiteboard-store';
import type { WhiteboardShape, WhiteboardTool } from '@/shared/types/whiteboard';
import {
  CANVAS_H,
  CANVAS_W,
  exportBoardPdf,
  exportBoardPng,
  getElementCenter,
  redrawBoard,
  simplifyStrokePoints,
} from '@/features/whiteboard/lib/whiteboard-canvas-utils';
import {
  exportBoardMermaid,
  exportBoardPlantUml,
  downloadText,
} from '@/features/whiteboard/lib/whiteboard-export-diagram';
import { bindWhiteboardYjs, pushWhiteboardYjs } from '@/lib/whiteboard-yjs';
import { useWhiteboardVersionsStore } from '@/stores/whiteboard-versions-store';
import { WhiteboardCollabBar } from '@/features/whiteboard/components/whiteboard-collab-bar';
import { useAuthStore } from '@/stores/auth-store';
import {
  WHITEBOARD_TEMPLATES,
  type WhiteboardTemplateId,
} from '@/features/whiteboard/lib/whiteboard-templates';
import {
  useWhiteboardPresence,
  WhiteboardPresenceOverlay,
} from '@/features/whiteboard/components/whiteboard-presence';
import { AiAssistantPanel } from '@/components/ai/ai-assistant-panel';

const PEN_COLOR = '#6366f1';

interface WhiteboardWorkspaceProps {
  projectId: string;
  workspaceId?: string | null;
}

export function WhiteboardWorkspace({ projectId, workspaceId }: WhiteboardWorkspaceProps) {
  const board = useWhiteboardStore((s) => s.getBoard(projectId));
  const addStroke = useWhiteboardStore((s) => s.addStroke);
  const addNote = useWhiteboardStore((s) => s.addNote);
  const addShape = useWhiteboardStore((s) => s.addShape);
  const updateNote = useWhiteboardStore((s) => s.updateNote);
  const removeNote = useWhiteboardStore((s) => s.removeNote);
  const removeShape = useWhiteboardStore((s) => s.removeShape);
  const addConnector = useWhiteboardStore((s) => s.addConnector);
  const removeLastStroke = useWhiteboardStore((s) => s.removeLastStroke);
  const clearStrokes = useWhiteboardStore((s) => s.clearStrokes);
  const setViewport = useWhiteboardStore((s) => s.setViewport);
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);
  const canUndo = useWhiteboardStore((s) => s.canUndo(projectId));
  const canRedo = useWhiteboardStore((s) => s.canRedo(projectId));
  const applyTemplate = useWhiteboardStore((s) => s.applyTemplate);
  const createGroup = useWhiteboardStore((s) => s.createGroup);
  const replaceBoard = useWhiteboardStore((s) => s.replaceBoard);
  const saveVersion = useWhiteboardVersionsStore((s) => s.saveVersion);
  const user = useAuthStore((s) => s.user);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [drawing, setDrawing] = useState(false);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [previewShape, setPreviewShape] = useState<WhiteboardShape | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [dragNoteId, setDragNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<WhiteboardTemplateId>('c4-context');

  const zoom = board.viewport.zoom;
  const panX = board.viewport.panX;
  const panY = board.viewport.panY;

  const canvasPointRef = useRef<(clientX: number, clientY: number) => { x: number; y: number } | null>(() => null);

  function canvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  canvasPointRef.current = canvasPoint;

  const { peers, laserTrail, broadcastPointer } = useWhiteboardPresence({
    projectId,
    tool,
    onCanvasPoint: (x, y) => canvasPointRef.current?.(x, y) ?? null,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo(projectId);
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo(projectId);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [projectId, undo, redo]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const next = Math.min(2.5, Math.max(0.35, zoom + (e.deltaY < 0 ? 0.08 : -0.08)));
      setViewport(projectId, { zoom: next });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [projectId, zoom, setViewport]);

  useEffect(() => {
    return bindWhiteboardYjs(projectId, (remote) => replaceBoard(remote));
  }, [projectId, replaceBoard]);

  useEffect(() => {
    const t = setTimeout(() => pushWhiteboardYjs(projectId, board), 800);
    return () => clearTimeout(t);
  }, [board, projectId]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    redrawBoard(ctx, board, previewShape, currentPoints, PEN_COLOR);
  }, [board, previewShape, currentPoints]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function toggleSelect(id: string, multi: boolean) {
    setActiveId(id);
    setSelectedIds((prev) => {
      if (!multi) return [id];
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function pickElement(id: string, multi = false) {
    toggleSelect(id, multi);
    if (tool === 'connector') {
      if (!connectFromId) {
        setConnectFromId(id);
      } else if (connectFromId !== id) {
        addConnector(projectId, connectFromId, id);
        setConnectFromId(null);
        setTool('select');
      }
    }
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(e.clientX, e.clientY);
    if (!point) return;

    if (tool === 'pen') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrawing(true);
      setCurrentPoints([point]);
      return;
    }

    if (tool === 'note') {
      const note = addNote(projectId, point.x - 100, point.y - 80);
      setActiveId(note.id);
      setTool('select');
      return;
    }

    if (tool === 'comment') {
      const note = addNote(projectId, point.x - 90, point.y - 60, 'Комментарий…');
      setActiveId(note.id);
      setTool('select');
      return;
    }

    if (tool === 'rect' || tool === 'circle' || tool === 'arrow') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setShapeStart(point);
      setPreviewShape({
        id: 'preview',
        kind: tool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: PEN_COLOR,
      });
    }
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    broadcastPointer(e.clientX, e.clientY);
    const point = canvasPoint(e.clientX, e.clientY);
    if (!point) return;

    if (drawing && tool === 'pen') {
      setCurrentPoints((prev) => [...prev, point]);
      return;
    }

    if (shapeStart && previewShape) {
      setPreviewShape({
        ...previewShape,
        x: Math.min(shapeStart.x, point.x),
        y: Math.min(shapeStart.y, point.y),
        width: tool === 'arrow' ? point.x - shapeStart.x : Math.abs(point.x - shapeStart.x),
        height: tool === 'arrow' ? point.y - shapeStart.y : Math.abs(point.y - shapeStart.y),
      });
    }
  }

  function finishShape(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!previewShape || !shapeStart) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const { kind, x, y, width, height, color } = previewShape;
    if (Math.abs(width) > 8 || Math.abs(height) > 8) {
      addShape(projectId, {
        kind,
        x: kind === 'arrow' ? shapeStart.x : x,
        y: kind === 'arrow' ? shapeStart.y : y,
        width,
        height,
        color,
      });
    }
    setShapeStart(null);
    setPreviewShape(null);
    setTool('select');
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drawing && tool === 'pen') {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDrawing(false);
      if (currentPoints.length > 1) {
        addStroke(projectId, {
          points: simplifyStrokePoints(currentPoints, 2.5),
          color: PEN_COLOR,
          width: 2.5,
        });
      }
      setCurrentPoints([]);
      return;
    }
    if (shapeStart && previewShape) finishShape(e);
  }

  function downloadPng() {
    downloadDataUrl(`whiteboard-${projectId}.png`, exportBoardPng(board));
  }

  function downloadPdf() {
    exportBoardPdf(board, `whiteboard-${projectId}.pdf`);
  }

  function handlePanDown(e: React.PointerEvent) {
    if (tool !== 'hand' && !(tool === 'select' && e.button === 1)) return;
    e.preventDefault();
    setPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, panX, panY });
  }

  function handlePanMove(e: React.PointerEvent) {
    if (!panning) return;
    setViewport(projectId, {
      panX: panStart.panX + (e.clientX - panStart.x),
      panY: panStart.panY + (e.clientY - panStart.y),
    });
  }

  function handleNoteDown(e: React.PointerEvent, noteId: string, x: number, y: number) {
    if (tool !== 'select' && tool !== 'connector') return;
    e.stopPropagation();
    pickElement(noteId, e.ctrlKey || e.metaKey);
    if (tool !== 'select') return;
    const point = canvasPoint(e.clientX, e.clientY);
    if (!point) return;
    setDragNoteId(noteId);
    setDragOffset({ x: point.x - x, y: point.y - y });
  }

  function handleDragMove(e: React.PointerEvent) {
    broadcastPointer(e.clientX, e.clientY);
    if (!dragNoteId) return;
    const point = canvasPoint(e.clientX, e.clientY);
    if (!point) return;
    updateNote(projectId, dragNoteId, { x: point.x - dragOffset.x, y: point.y - dragOffset.y });
  }

  const tools: { id: WhiteboardTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'select', label: 'Выбор', icon: Icons.MousePointer2 },
    { id: 'hand', label: 'Рука', icon: Icons.Hand },
    { id: 'pen', label: 'Ручка', icon: Icons.Pencil },
    { id: 'note', label: 'Стикер', icon: Icons.StickyNote },
    { id: 'rect', label: 'Прямоуг.', icon: Icons.Square },
    { id: 'circle', label: 'Круг', icon: Icons.Circle },
    { id: 'arrow', label: 'Стрелка', icon: Icons.ArrowRight },
    { id: 'connector', label: 'Связь', icon: Icons.Link2 },
    { id: 'laser', label: 'Laser', icon: Icons.Zap },
    { id: 'comment', label: 'Коммент.', icon: Icons.MessageSquare },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/60 bg-card">
      <WhiteboardCollabBar projectId={projectId} hostUserId={user?.id} />
      {workspaceId && (
        <div className="border-b border-border/60 px-3 py-1.5">
          <AiAssistantPanel
            context="whiteboard"
            workspaceId={workspaceId}
            projectId={projectId}
            compact
            extra={{ boardContent: board }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
        {tools.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tool === t.id ? 'secondary' : 'ghost'}
            className="h-8 gap-1.5"
            onClick={() => {
              setTool(t.id);
              setConnectFromId(null);
            }}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t.label}</span>
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => removeLastStroke(projectId)}>
          <Icons.Eraser className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" disabled={!canUndo} onClick={() => undo(projectId)}>
          <Icons.Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" disabled={!canRedo} onClick={() => redo(projectId)}>
          <Icons.Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Select value={templateId} onValueChange={(v) => setTemplateId(v as WhiteboardTemplateId)}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="Шаблон" />
          </SelectTrigger>
          <SelectContent>
            {WHITEBOARD_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => applyTemplate(projectId, templateId)}
        >
          <Icons.LayoutTemplate className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Шаблон</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={selectedIds.length < 2}
          onClick={() => {
            createGroup(projectId, selectedIds);
            setSelectedIds([]);
          }}
        >
          Группа
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setViewport(projectId, { zoom: zoom - 0.1 })}>
            −
          </Button>
          <span className="flex h-8 items-center px-1 text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setViewport(projectId, { zoom: zoom + 0.1 })}>
            +
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={downloadPng}>
            PNG
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={downloadPdf}>
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => downloadText(`whiteboard-${projectId}.mmd`, exportBoardMermaid(board))}
          >
            Mermaid
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => downloadText(`whiteboard-${projectId}.puml`, exportBoardPlantUml(board))}
          >
            PlantUML
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => saveVersion(projectId, board)}
          >
            Версия
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => clearStrokes(projectId)}>
            Очистить
          </Button>
        </div>
      </div>

      {connectFromId && (
        <div className="border-b border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary">
          Выберите второй элемент для связи…
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle,_rgb(148_163_184/0.25)_1px,_transparent_1px)] bg-[length:24px_24px] bg-muted/20"
        onPointerDown={handlePanDown}
        onPointerMove={(e) => {
          handlePanMove(e);
          handleDragMove(e);
        }}
        onPointerUp={() => {
          setPanning(false);
          setDragNoteId(null);
        }}
        onPointerLeave={() => {
          setPanning(false);
          setDragNoteId(null);
        }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className={cn(
              'absolute inset-0 touch-none',
              tool === 'pen' && 'cursor-crosshair',
              tool === 'note' && 'cursor-copy',
              (tool === 'rect' || tool === 'circle' || tool === 'arrow') && 'cursor-cell',
              tool === 'hand' && 'cursor-grab',
              tool === 'laser' && 'cursor-crosshair',
            )}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
          />

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              <marker id="wb-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
              </marker>
            </defs>
            {board.connectors.map((c) => {
              const from = getElementCenter(board, c.fromId);
              const to = getElementCenter(board, c.toId);
              if (!from || !to) return null;
              return (
                <line
                  key={c.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={c.color}
                  strokeWidth={2}
                  markerEnd="url(#wb-arrow)"
                />
              );
            })}
          </svg>

          {board.shapes.map((shape) => (
            <button
              key={shape.id}
              type="button"
              className={cn(
                'absolute border-2 border-transparent',
                (tool === 'select' || tool === 'connector') && 'pointer-events-auto',
                activeId === shape.id && 'border-primary/60',
                selectedIds.includes(shape.id) && 'border-primary/60 bg-primary/5',
              )}
              style={{
                left: shape.kind === 'arrow' ? Math.min(shape.x, shape.x + shape.width) : shape.x,
                top: shape.kind === 'arrow' ? Math.min(shape.y, shape.y + shape.height) : shape.y,
                width: Math.max(Math.abs(shape.width), 12),
                height: Math.max(Math.abs(shape.height), 12),
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                pickElement(shape.id, e.ctrlKey || e.metaKey);
              }}
              onDoubleClick={() => removeShape(projectId, shape.id)}
              aria-label="Фигура"
            />
          ))}

          {board.notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'absolute flex flex-col rounded-md border border-black/10 shadow-md',
                (tool === 'select' || tool === 'connector') && 'pointer-events-auto',
                tool === 'select' && 'cursor-grab active:cursor-grabbing',
                activeId === note.id && 'ring-2 ring-primary/50',
                selectedIds.includes(note.id) && 'ring-2 ring-primary/50',
              )}
              style={{
                left: note.x,
                top: note.y,
                width: note.width,
                height: note.height,
                backgroundColor: note.color,
              }}
              onPointerDown={(e) => handleNoteDown(e, note.id, note.x, note.y)}
            >
              <div className="flex items-center justify-between border-b border-black/10 px-2 py-1">
                <span className="text-[10px] font-medium text-black/50">Стикер</span>
                {tool === 'select' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-black/50 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNote(projectId, note.id);
                    }}
                  >
                    <Icons.X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Textarea
                value={note.text}
                onChange={(e) => updateNote(projectId, note.id, { text: e.target.value })}
                placeholder="Текст…"
                className="min-h-0 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-black shadow-none focus-visible:ring-0"
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          ))}

          <WhiteboardPresenceOverlay peers={peers} laserTrail={laserTrail} />
        </div>
      </div>

      <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
        Ctrl+Z/Y — undo/redo · Ctrl+клик — мультивыбор · Laser — указка для коллаба · Шаблоны C4 / User Flow
      </p>
    </div>
  );
}
