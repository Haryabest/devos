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

/** Dev WebSocket relay — работает без Docker/backend (Tauri + браузеры). */
export function collabWsPlugin(): Plugin {
  return {
    name: 'devos-collab-ws',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      const clients = new Map<WebSocket, string>();

      wss.on('connection', (socket, req: IncomingMessage) => {
        const url = new URL(req.url ?? '/ws/collab', 'http://local');
        const clientId = url.searchParams.get('clientId') ?? 'unknown';
        clients.set(socket, clientId);

        socket.send(JSON.stringify({ event: 'connected', data: { clientId } }));

        socket.on('message', (raw) => {
          try {
            const envelope = JSON.parse(String(raw)) as {
              event?: string;
              data?: SyncMessage;
            };
            if (envelope.event === 'sync' && envelope.data) {
              const msg = envelope.data;
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
          } catch {
            /* ignore */
          }
        });

        socket.on('close', () => clients.delete(socket));
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
