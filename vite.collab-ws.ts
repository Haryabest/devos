import type { Plugin } from 'vite';
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import { WebSocketServer, WebSocket } from 'ws';

interface SyncMessage {
  clientId: string;
  senderId: string;
  senderName: string;
  store: string;
  payload: unknown;
  ts: number;
}

type CollabRoomRole = 'host' | 'guest';

interface RoomEntry {
  socket: WebSocket;
  role: CollabRoomRole;
}

/** Dev WebSocket relay — работает без Docker/backend (Tauri + браузеры). */
export function collabWsPlugin(): Plugin {
  return {
    name: 'devos-collab-ws',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      const clients = new Map<WebSocket, string>();
      const rooms = new Map<string, RoomEntry[]>();

      function leaveRoom(socket: WebSocket, projectId: string) {
        const entries = rooms.get(projectId);
        if (!entries) return;
        const next = entries.filter((entry) => entry.socket !== socket);
        if (next.length === 0) rooms.delete(projectId);
        else rooms.set(projectId, next);
      }

      function notifyHostLeft(projectId: string, exclude: WebSocket) {
        const envelope = JSON.stringify({
          event: 'host-left',
          data: { projectId, userId: null },
        });
        for (const entry of rooms.get(projectId) ?? []) {
          if (entry.socket === exclude || entry.role !== 'guest') continue;
          if (entry.socket.readyState !== WebSocket.OPEN) continue;
          entry.socket.send(envelope);
        }
      }

      function removeClient(socket: WebSocket) {
        for (const [projectId, entries] of rooms) {
          for (const entry of entries) {
            if (entry.socket !== socket || entry.role !== 'host') continue;
            notifyHostLeft(projectId, socket);
          }
        }
        for (const [projectId, entries] of rooms) {
          const next = entries.filter((entry) => entry.socket !== socket);
          if (next.length === 0) rooms.delete(projectId);
          else rooms.set(projectId, next);
        }
        clients.delete(socket);
      }

      wss.on('connection', (socket, req: IncomingMessage) => {
        const url = new URL(req.url ?? '/ws/collab', 'http://local');
        const clientId = url.searchParams.get('clientId') ?? 'unknown';
        clients.set(socket, clientId);

        socket.send(JSON.stringify({ event: 'connected', data: { clientId } }));

        socket.on('message', (raw) => {
          try {
            const envelope = JSON.parse(String(raw)) as {
              event?: string;
              data?: SyncMessage | { projectId?: string; role?: CollabRoomRole };
            };

            if (envelope.event === 'room-join' && envelope.data && 'projectId' in envelope.data) {
              const { projectId, role } = envelope.data;
              if (!projectId || (role !== 'host' && role !== 'guest')) return;
              leaveRoom(socket, projectId);
              const entries = rooms.get(projectId) ?? [];
              entries.push({ socket, role });
              rooms.set(projectId, entries);
              return;
            }

            if (envelope.event === 'room-leave' && envelope.data && 'projectId' in envelope.data) {
              const projectId = envelope.data.projectId;
              if (!projectId) return;
              leaveRoom(socket, projectId);
              return;
            }

            if (envelope.event === 'sync' && envelope.data) {
              const msg = envelope.data as SyncMessage;
              for (const [peer, peerId] of clients) {
                if (peer === socket || peer.readyState !== WebSocket.OPEN) continue;
                if (peerId === msg.clientId) continue;
                peer.send(JSON.stringify({ event: 'sync', data: msg }));
              }
            }
            if (envelope.event === 'sync-request') {
              for (const [peer] of clients) {
                if (peer === socket || peer.readyState !== WebSocket.OPEN) continue;
                peer.send(JSON.stringify({ event: 'sync-request', data: {} }));
              }
            }
            if (envelope.event === 'presence' && envelope.data && 'projectId' in envelope.data) {
              const data = envelope.data as { projectId: string; clientId?: string };
              for (const [peer, peerId] of clients) {
                if (peer === socket || peer.readyState !== WebSocket.OPEN) continue;
                if (data.clientId && peerId === data.clientId) continue;
                const inRoom = (rooms.get(data.projectId) ?? []).some((e) => e.socket === peer);
                if (!inRoom) continue;
                peer.send(JSON.stringify({ event: 'presence', data: envelope.data }));
              }
            }
            if (
              (envelope.event === 'voice-signal' || envelope.event === 'yjs-update') &&
              envelope.data &&
              typeof envelope.data === 'object'
            ) {
              const data = envelope.data as { projectId?: string; roomId?: string; from?: string };
              const roomKey = data.projectId ?? data.roomId;
              if (roomKey) {
                for (const [peer, peerId] of clients) {
                  if (peer === socket || peer.readyState !== WebSocket.OPEN) continue;
                  if (data.from && peerId === data.from) continue;
                  const inRoom = (rooms.get(roomKey) ?? []).some((e) => e.socket === peer);
                  if (!inRoom) continue;
                  peer.send(JSON.stringify({ event: envelope.event, data: envelope.data }));
                }
              }
            }
          } catch {
            /* ignore */
          }
        });

        socket.on('close', () => removeClient(socket));
      });

      server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
        if (!req.url?.startsWith('/ws/collab')) return;
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      });
    },
  };
}
