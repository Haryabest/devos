import { api } from '@/lib/api';

export type AiContextKind = 'general' | 'document' | 'task' | 'roadmap' | 'whiteboard' | 'project';

export interface AiAskRequest {
  workspaceId: string;
  projectId?: string;
  question: string;
  conversationId?: string;
  context?: AiContextKind;
}

export interface AiMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface AiAskResponse {
  conversationId: string;
  message: AiMessage;
}

export interface AiGenerateTasksRequest {
  workspaceId: string;
  projectId: string;
  prompt: string;
  documentId?: string;
}

export interface AiGeneratedTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
}

export interface AiGenerateTasksResponse {
  created: number;
  tasks: AiGeneratedTask[];
}

export interface AiDocumentAssistRequest {
  workspaceId: string;
  projectId?: string;
  documentId?: string;
  instruction: string;
  content: string;
}

export interface AiDocumentAssistResponse {
  content: string;
}

export interface AiRoadmapSuggestRequest {
  workspaceId: string;
  projectId: string;
  prompt: string;
}

export interface AiRoadmapCard {
  title: string;
  description: string;
  column: string;
}

export interface AiRoadmapSuggestResponse {
  cards: AiRoadmapCard[];
}

export interface AiWhiteboardSuggestRequest {
  workspaceId: string;
  projectId: string;
  prompt: string;
  boardContent?: unknown;
}

export interface AiWhiteboardElement {
  type: string;
  label: string;
  x: number;
  y: number;
}

export interface AiWhiteboardSuggestResponse {
  elements: AiWhiteboardElement[];
  raw?: string;
}

export interface AiAnalyzeProjectRequest {
  workspaceId: string;
  projectId: string;
}

export interface AiAnalyzeProjectResponse {
  summary: string;
  risks: string[];
  recommendations: string[];
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiMessage[];
}

export interface AiHealthScoreResponse {
  projectId: string;
  score: number;
  summary: string;
  risks: string[];
  recommendations: string[];
}

export function askAi(body: AiAskRequest) {
  return api<AiAskResponse>('/ai/ask', { method: 'POST', body: JSON.stringify(body) });
}

export function generateTasks(body: AiGenerateTasksRequest) {
  return api<AiGenerateTasksResponse>('/ai/generate-tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function documentAssist(body: AiDocumentAssistRequest) {
  return api<AiDocumentAssistResponse>('/ai/document-assist', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function roadmapSuggest(body: AiRoadmapSuggestRequest) {
  return api<AiRoadmapSuggestResponse>('/ai/roadmap-suggest', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function whiteboardSuggest(body: AiWhiteboardSuggestRequest) {
  return api<AiWhiteboardSuggestResponse>('/ai/whiteboard-suggest', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function analyzeProject(body: AiAnalyzeProjectRequest) {
  return api<AiAnalyzeProjectResponse>('/ai/analyze-project', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchAiConversations(workspaceId: string) {
  return api<AiConversation[]>(`/ai/conversations?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function fetchHealthScore(projectId: string) {
  return api<AiHealthScoreResponse>(`/ai/health-score/${encodeURIComponent(projectId)}`);
}
