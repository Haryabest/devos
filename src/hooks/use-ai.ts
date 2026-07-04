import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeProject,
  askAi,
  documentAssist,
  fetchAiConversations,
  fetchHealthScore,
  generateTasks,
  roadmapSuggest,
  whiteboardSuggest,
  type AiAnalyzeProjectRequest,
  type AiAskRequest,
  type AiDocumentAssistRequest,
  type AiGenerateTasksRequest,
  type AiRoadmapSuggestRequest,
  type AiWhiteboardSuggestRequest,
} from '@/lib/ai-api';

export function useAskAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AiAskRequest) => askAi(body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['ai', 'conversations', vars.workspaceId] });
    },
  });
}

export function useGenerateTasks() {
  return useMutation({
    mutationFn: (body: AiGenerateTasksRequest) => generateTasks(body),
  });
}

export function useDocumentAssist() {
  return useMutation({
    mutationFn: (body: AiDocumentAssistRequest) => documentAssist(body),
  });
}

export function useRoadmapSuggest() {
  return useMutation({
    mutationFn: (body: AiRoadmapSuggestRequest) => roadmapSuggest(body),
  });
}

export function useWhiteboardSuggest() {
  return useMutation({
    mutationFn: (body: AiWhiteboardSuggestRequest) => whiteboardSuggest(body),
  });
}

export function useAnalyzeProject() {
  return useMutation({
    mutationFn: (body: AiAnalyzeProjectRequest) => analyzeProject(body),
  });
}

export function useAiConversations(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['ai', 'conversations', workspaceId],
    queryFn: () => fetchAiConversations(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useHealthScore(projectId: string | null | undefined, enabled = false) {
  return useQuery({
    queryKey: ['ai', 'health-score', projectId],
    queryFn: () => fetchHealthScore(projectId!),
    enabled: !!projectId && enabled,
    staleTime: 60_000,
  });
}
