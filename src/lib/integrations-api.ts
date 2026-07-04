import { api } from '@/lib/api';

export type IntegrationProvider = 'GITHUB' | 'GITLAB' | 'FIGMA';

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  externalId?: string | null;
  scopes: string[];
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectUrlResponse {
  url: string;
}

export function fetchIntegrations(workspaceId: string) {
  return api<Integration[]>(`/integrations?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function fetchIntegrationConnectUrl(provider: string, workspaceId: string) {
  return api<ConnectUrlResponse>(
    `/integrations/${provider.toLowerCase()}/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function disconnectIntegration(provider: string, workspaceId: string) {
  return api<void>(`/integrations/${provider.toLowerCase()}?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
  });
}
