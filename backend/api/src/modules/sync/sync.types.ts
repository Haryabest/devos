/** Сообщение live sync — зеркало frontend `src/lib/sync-types.ts`. */
export type SyncStoreName =
  | 'projects'
  | 'tasks'
  | 'docs'
  | 'api'
  | 'groups'
  | 'team'
  | 'clients';

export interface SyncMessage {
  clientId: string;
  senderId: string;
  senderName: string;
  store: SyncStoreName;
  payload: unknown;
  ts: number;
}

export interface CollabClientMeta {
  clientId: string;
  userId: string | null;
  userName: string | null;
}
