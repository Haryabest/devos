import * as Y from 'yjs';
import { pushCollabRaw, subscribeCollabRaw, getCollabClientId } from '@/lib/collab-ws';
import type { WhiteboardData } from '@/shared/types/whiteboard';
import { normalizeBoard } from '@/shared/types/whiteboard';

const docs = new Map<string, Y.Doc>();

function getDoc(projectId: string) {
  let doc = docs.get(projectId);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(projectId, doc);
  }
  return doc;
}

export function bindWhiteboardYjs(
  projectId: string,
  onRemote: (board: WhiteboardData) => void,
): () => void {
  const doc = getDoc(projectId);
  const text = doc.getText('board-json');

  const apply = () => {
    try {
      const raw = text.toString();
      if (!raw) return;
      onRemote(normalizeBoard({ ...JSON.parse(raw), projectId }));
    } catch {
      /* ignore */
    }
  };

  text.observe(apply);

  const unsub = subscribeCollabRaw((event, data) => {
    if (event !== 'yjs-update') return;
    const msg = data as { projectId?: string; update?: number[]; from?: string };
    if (msg.projectId !== projectId || msg.from === getCollabClientId()) return;
    if (!msg.update) return;
    Y.applyUpdate(doc, new Uint8Array(msg.update));
  });

  return () => {
    text.unobserve(apply);
    unsub();
  };
}

export function pushWhiteboardYjs(projectId: string, board: WhiteboardData) {
  const doc = getDoc(projectId);
  const text = doc.getText('board-json');
  doc.transact(() => {
    text.delete(0, text.length);
    text.insert(0, JSON.stringify(board));
  });
  const update = Y.encodeStateAsUpdate(doc);
  pushCollabRaw('yjs-update', {
    projectId,
    update: [...update],
    from: getCollabClientId(),
  });
}
