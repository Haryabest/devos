import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getCollabClientId, joinCollabRoom, leaveCollabRoom } from '@/lib/collab-ws';
import { sendPresence, subscribePresence, type CollabPresence } from '@/lib/collab-presence';
import { CANVAS_H, CANVAS_W } from '@/features/whiteboard/lib/whiteboard-canvas-utils';

interface RemotePeer {
  clientId: string;
  userName: string;
  x: number;
  y: number;
  kind: CollabPresence['kind'];
  ts: number;
}

export function useWhiteboardPresence({
  projectId,
  tool,
  onCanvasPoint,
}: {
  projectId: string;
  tool: string;
  onCanvasPoint: (clientX: number, clientY: number) => { x: number; y: number } | null;
}) {
  const user = useAuthStore((s) => s.user);
  const [peers, setPeers] = useState<RemotePeer[]>([]);
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number; ts: number }[]>([]);
  const lastSend = useRef(0);

  useEffect(() => {
    joinCollabRoom(projectId, 'host');
    return () => leaveCollabRoom(projectId);
  }, [projectId]);

  useEffect(() => {
    return subscribePresence((msg) => {
      if (msg.projectId !== projectId) return;
      if (msg.clientId === getCollabClientId()) return;
      setPeers((prev) => {
        const rest = prev.filter((p) => p.clientId !== msg.clientId);
        return [...rest, { ...msg, ts: msg.ts }];
      });
      if (msg.kind === 'laser') {
        setLaserTrail((prev) => [...prev.slice(-40), { x: msg.x, y: msg.y, ts: msg.ts }]);
      }
    });
  }, [projectId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPeers((prev) => prev.filter((p) => now - p.ts < 8000));
      setLaserTrail((prev) => prev.filter((p) => now - p.ts < 1200));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function broadcastPointer(clientX: number, clientY: number) {
    const now = Date.now();
    if (now - lastSend.current < 40) return;
    lastSend.current = now;
    const point = onCanvasPoint(clientX, clientY);
    if (!point) return;
    sendPresence({
      kind: tool === 'laser' ? 'laser' : 'cursor',
      projectId,
      clientId: getCollabClientId(),
      userId: user?.id ?? null,
      userName: user?.name ?? 'Гость',
      x: point.x,
      y: point.y,
    });
  }

  return { peers, laserTrail, broadcastPointer };
}

export function WhiteboardPresenceOverlay({
  peers,
  laserTrail,
}: {
  peers: RemotePeer[];
  laserTrail: { x: number; y: number; ts: number }[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40" style={{ width: CANVAS_W, height: CANVAS_H }}>
      {peers.map((p) => (
        <div
          key={p.clientId}
          className="absolute"
          style={{ left: p.x, top: p.y }}
        >
          <div
            className="h-3 w-3 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: p.kind === 'laser' ? '#ef4444' : '#6366f1' }}
          />
          <span className="ml-3 -mt-1 inline-block rounded bg-foreground/90 px-1.5 py-0.5 text-[10px] text-background">
            {p.userName}
          </span>
        </div>
      ))}
      {laserTrail.map((p, i) => (
        <div
          key={`${p.x}-${p.y}-${i}`}
          className="absolute h-2 w-2 rounded-full bg-red-500/70 blur-[1px]"
          style={{ left: p.x, top: p.y }}
        />
      ))}
    </div>
  );
}
