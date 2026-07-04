import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disconnectIntegration,
  fetchIntegrationConnectUrl,
  fetchIntegrations,
  type IntegrationProvider,
} from '@/lib/integrations-api';

export function useIntegrations(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: () => fetchIntegrations(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useConnectIntegration() {
  return useMutation({
    mutationFn: async ({
      provider,
      workspaceId,
    }: {
      provider: IntegrationProvider;
      workspaceId: string;
    }) => {
      const { url } = await fetchIntegrationConnectUrl(provider, workspaceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      workspaceId,
    }: {
      provider: IntegrationProvider;
      workspaceId: string;
    }) => disconnectIntegration(provider, workspaceId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['integrations', vars.workspaceId] });
    },
  });
}
