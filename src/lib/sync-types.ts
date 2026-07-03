export type SyncStoreName = 'projects' | 'tasks' | 'docs' | 'api' | 'groups' | 'team' | 'clients';

export interface SyncMessage {
  clientId: string;
  senderId: string;
  senderName: string;
  store: SyncStoreName;
  payload: unknown;
  ts: number;
}
