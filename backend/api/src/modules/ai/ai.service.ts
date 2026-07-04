import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import { PrismaClient, TaskStatus } from '@prisma/client';
import OpenAI from 'openai';
import { env } from '../../config/env.js';
import type {
  AiAskDto,
  AiContextKind,
  AiDocumentAssistDto,
  AiGenerateTasksDto,
  AiRoadmapSuggestDto,
  AiWhiteboardSuggestDto,
} from './ai.dto.js';
import { EmbeddingsService } from './embeddings.service.js';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(EmbeddingsService) private readonly embeddings: EmbeddingsService,
  ) {
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  private client() {
    if (!this.openai) throw new ServiceUnavailableException('OpenAI API key не настроен');
    return this.openai;
  }

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
    return m;
  }

  private async buildContext(
    workspaceId: string,
    projectId: string | undefined,
    kind: AiContextKind = 'general',
  ) {
    const parts: string[] = [];

    const projects = await this.prisma.project.findMany({
      where: { workspaceId, ...(projectId ? { id: projectId } : {}) },
      select: { id: true, name: true, description: true, status: true },
      take: 10,
    });
    if (projects.length) {
      parts.push('Projects:\n' + projects.map((p) => `- ${p.name} (${p.status}): ${p.description ?? ''}`).join('\n'));
    }

    if (kind === 'task' || kind === 'general' || kind === 'project') {
      const tasks = await this.prisma.task.findMany({
        where: { project: { workspaceId, ...(projectId ? { id: projectId } : {}) } },
        select: { title: true, status: true, priority: true, description: true },
        take: 30,
        orderBy: { updatedAt: 'desc' },
      });
      if (tasks.length) {
        parts.push('Tasks:\n' + tasks.map((t) => `- [${t.status}] ${t.title}: ${t.description ?? ''}`).join('\n'));
      }
    }

    if (kind === 'document' || kind === 'general') {
      const docs = await this.prisma.document.findMany({
        where: { workspaceId, ...(projectId ? { projectId } : {}) },
        select: { title: true, contentMd: true },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      if (docs.length) {
        parts.push(
          'Documents:\n' +
            docs.map((d) => `- ${d.title}: ${d.contentMd.slice(0, 500)}`).join('\n'),
        );
      }
    }

    if (kind === 'roadmap' || kind === 'general') {
      const milestones = await this.prisma.milestone.findMany({
        where: { project: { workspaceId, ...(projectId ? { id: projectId } : {}) } },
        select: { name: true, version: true, dueAt: true, releasedAt: true },
        take: 20,
      });
      if (milestones.length) {
        parts.push('Milestones:\n' + milestones.map((m) => `- ${m.name} (due: ${m.dueAt?.toISOString() ?? 'n/a'})`).join('\n'));
      }
    }

    if (kind === 'whiteboard' || kind === 'general') {
      const boards = await this.prisma.whiteboard.findMany({
        where: { project: { workspaceId, ...(projectId ? { id: projectId } : {}) } },
        select: { content: true, project: { select: { name: true } } },
        take: 5,
      });
      if (boards.length) {
        parts.push(
          'Whiteboards:\n' +
            boards.map((b) => `- ${b.project.name}: ${JSON.stringify(b.content).slice(0, 400)}`).join('\n'),
        );
      }
    }

    return parts.join('\n\n');
  }

  private async chat(system: string, user: string) {
    const res = await this.client().chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    });
    return res.choices[0]?.message?.content?.trim() ?? '';
  }

  async ask(userId: string, dto: AiAskDto) {
    await this.assertMember(dto.workspaceId, userId);
    const context = await this.buildContext(dto.workspaceId, dto.projectId, dto.context ?? 'general');
    const ragChunks = await this.embeddings.searchSimilar(dto.workspaceId, dto.question, dto.projectId);
    const ragBlock = ragChunks.length
      ? `\n\nSemantic search (RAG):\n${ragChunks.map((c) => `- ${c.slice(0, 400)}`).join('\n')}`
      : '';

    let conversationId = dto.conversationId;
    if (conversationId) {
      const conv = await this.prisma.aiConversation.findUnique({ where: { id: conversationId } });
      if (!conv || conv.userId !== userId) throw new NotFoundException('Диалог не найден');
    } else {
      const conv = await this.prisma.aiConversation.create({
        data: {
          workspaceId: dto.workspaceId,
          projectId: dto.projectId,
          userId,
          title: dto.question.slice(0, 80),
        },
      });
      conversationId = conv.id;
    }

    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'USER', content: dto.question },
    });

    const answer = await this.chat(
      'Ты AI-ассистент DevOS. Отвечай кратко и по делу на русском. Используй контекст workspace.',
      `Контекст:\n${context}${ragBlock}\n\nВопрос: ${dto.question}`,
    );

    const assistantMsg = await this.prisma.aiMessage.create({
      data: { conversationId, role: 'ASSISTANT', content: answer },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId,
      message: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
    };
  }

  async generateTasks(userId: string, dto: AiGenerateTasksDto) {
    await this.assertMember(dto.workspaceId, userId);
    let docContext = '';
    if (dto.documentId) {
      const doc = await this.prisma.document.findUnique({ where: { id: dto.documentId } });
      if (doc) docContext = `\nDocument:\n${doc.title}\n${doc.contentMd.slice(0, 3000)}`;
    }
    const context = await this.buildContext(dto.workspaceId, dto.projectId, 'task');
    const raw = await this.chat(
      'Верни JSON-массив задач: [{ "title": string, "description": string, "priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL" }]. Только JSON.',
      `${context}${docContext}\n\nPrompt: ${dto.prompt}`,
    );
    let tasks: { title: string; description?: string; priority?: string }[] = [];
    try {
      tasks = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '')) as typeof tasks;
    } catch {
      throw new BadRequestException('AI вернул некорректный JSON');
    }

    const created = [];
    for (const t of tasks.slice(0, 20)) {
      const task = await this.prisma.task.create({
        data: {
          projectId: dto.projectId,
          authorId: userId,
          title: t.title,
          description: t.description,
          priority: (t.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') ?? 'MEDIUM',
          status: TaskStatus.BACKLOG,
        },
      });
      created.push(task);
    }
    return { created: created.length, tasks: created };
  }

  async documentAssist(userId: string, dto: AiDocumentAssistDto) {
    await this.assertMember(dto.workspaceId, userId);
    const content = await this.chat(
      'Ты редактор документов. Верни только обновлённый markdown без пояснений.',
      `Instruction: ${dto.instruction}\n\nContent:\n${dto.content}`,
    );
    return { content };
  }

  async roadmapSuggest(userId: string, dto: AiRoadmapSuggestDto) {
    await this.assertMember(dto.workspaceId, userId);
    const context = await this.buildContext(dto.workspaceId, dto.projectId, 'roadmap');
    const raw = await this.chat(
      'Верни JSON: { "cards": [{ "title": string, "description": string, "column": "planned"|"in-progress"|"done" }] }. Только JSON.',
      `${context}\n\nPrompt: ${dto.prompt}`,
    );
    try {
      return JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '')) as {
        cards: { title: string; description: string; column: string }[];
      };
    } catch {
      throw new BadRequestException('AI вернул некорректный JSON');
    }
  }

  async whiteboardSuggest(userId: string, dto: AiWhiteboardSuggestDto) {
    await this.assertMember(dto.workspaceId, userId);
    const raw = await this.chat(
      'Предложи элементы whiteboard в JSON: { "elements": [{ "type": string, "label": string, "x": number, "y": number }] }',
      `Board: ${JSON.stringify(dto.boardContent ?? {})}\n\nPrompt: ${dto.prompt}`,
    );
    try {
      return JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '')) as { elements: unknown[] };
    } catch {
      return { elements: [], raw };
    }
  }

  async analyzeProject(userId: string, workspaceId: string, projectId: string) {
    await this.assertMember(workspaceId, userId);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        tasks: { select: { status: true, priority: true, dueAt: true } },
        milestones: true,
        _count: { select: { documents: true, tasks: true } },
      },
    });
    if (project.workspaceId !== workspaceId) throw new ForbiddenException();

    const context = await this.buildContext(workspaceId, projectId, 'project');
    const analysis = await this.chat(
      'Проанализируй проект. Верни JSON: { "summary": string, "risks": string[], "recommendations": string[] }',
      context,
    );
    try {
      return JSON.parse(analysis.replace(/^```json?\s*|\s*```$/g, '')) as {
        summary: string;
        risks: string[];
        recommendations: string[];
      };
    } catch {
      return { summary: analysis, risks: [], recommendations: [] };
    }
  }

  async listConversations(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const rows = await this.prisma.aiConversation.findMany({
      where: { workspaceId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    }));
  }

  async healthScore(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { tasks: true },
    });
    await this.assertMember(project.workspaceId, userId);

    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === 'DONE').length;
    const overdue = project.tasks.filter(
      (t) => t.dueAt && t.dueAt < new Date() && t.status !== 'DONE',
    ).length;
    const critical = project.tasks.filter((t) => t.priority === 'CRITICAL' && t.status !== 'DONE').length;

    let score = total ? Math.round((done / total) * 70) : 50;
    score -= Math.min(overdue * 5, 25);
    score -= Math.min(critical * 3, 15);
    score = Math.max(0, Math.min(100, score));

    const risks: string[] = [];
    if (overdue > 0) risks.push(`${overdue} просроченных задач`);
    if (critical > 0) risks.push(`${critical} критичных задач не закрыто`);
    if (total === 0) risks.push('Нет задач в проекте');

    const recommendations: string[] = [];
    if (overdue > 0) recommendations.push('Пересмотреть дедлайны просроченных задач');
    if (done / Math.max(total, 1) < 0.3) recommendations.push('Ускорить закрытие backlog');

    return {
      projectId,
      score,
      summary: `Выполнено ${done}/${total} задач`,
      risks,
      recommendations,
    };
  }

  async indexWorkspace(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    return this.embeddings.indexWorkspace(workspaceId);
  }
}
