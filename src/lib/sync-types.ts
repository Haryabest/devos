export type SyncStoreName =
  | 'projects'
  | 'tasks'
  | 'docs'
  | 'api'
  | 'groups'
  | 'team'
  | 'clients'
  | 'whiteboard';

export interface SyncMessage {
  clientId: string;
  senderId: string;
  senderName: string;
  store: SyncStoreName;
  payload: unknown;
  ts: number;
}
