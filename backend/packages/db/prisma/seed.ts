/**
 * Dev seed — полный набор демо-данных для DevOS Owner.
 * Login: owner@devos.local / devos12345
 */
import {
  Prisma,
  PrismaClient,
  WorkspaceRole,
  ProjectType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  UserKind,
  CommentTarget,
  IntegrationProvider,
  AiRole,
  EmbeddingSource,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const IDS = {
  owner: 'seed-user-owner',
  dev1: 'seed-user-dev1',
  dev2: 'seed-user-dev2',
  manager: 'seed-user-manager',
  workspace: 'seed-workspace-devos',
  clientAcme: 'seed-client-acme',
  clientStartup: 'seed-client-startup',
  clientInternal: 'seed-client-internal',
  projectCore: 'seed-project-devos',
  projectMobile: 'seed-project-mobile',
  projectApi: 'seed-project-api',
  projectMarketing: 'seed-project-marketing',
  sprint1: 'seed-sprint-1',
  milestoneV01: 'seed-milestone-v01',
  milestoneV02: 'seed-milestone-v02',
  folderSpecs: 'seed-folder-specs',
  folderApi: 'seed-folder-api',
  folderNested: 'seed-folder-nested',
  docArch: 'seed-doc-arch',
  docReadme: 'seed-doc-readme',
  docApi: 'seed-doc-api',
  docRunbook: 'seed-doc-runbook',
  docMobile: 'seed-doc-mobile',
  aiConv: 'seed-ai-conv-1',
  integrationGithub: 'seed-int-github',
  integrationGitlab: 'seed-int-gitlab',
  integrationFigma: 'seed-int-figma',
} as const;

function clientExtra(data: {
  contactList?: Prisma.InputJsonValue[];
  contracts?: Prisma.InputJsonValue[];
  files?: Prisma.InputJsonValue[];
  notes?: string;
}): Prisma.InputJsonValue {
  return {
    contactList: data.contactList ?? [],
    contracts: data.contracts ?? [],
    files: data.files ?? [],
    notes: data.notes ?? '',
  };
}

function docPayload(data: {
  format: string;
  content: string;
  attachments?: unknown[];
  history?: unknown[];
  fileData?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}) {
  return JSON.stringify({
    format: data.format,
    content: data.content,
    fileData: data.fileData ?? null,
    fileName: data.fileName ?? null,
    mimeType: data.mimeType ?? null,
    attachments: data.attachments ?? [],
    history: data.history ?? [],
  });
}

function whiteboardC4(projectId: string) {
  return {
    projectId,
    strokes: [],
    notes: [
      { id: 'wb-note-user', x: 200, y: 200, width: 220, height: 140, color: '#bfdbfe', text: 'Пользователь\n(Dev / PM)', groupId: null },
      { id: 'wb-note-system', x: 520, y: 180, width: 260, height: 180, color: '#bbf7d0', text: 'DevOS Core\nNestJS + React', groupId: null },
      { id: 'wb-note-api', x: 880, y: 220, width: 220, height: 140, color: '#fef08a', text: 'OpenAI API\nGitHub / Figma', groupId: null },
    ],
    shapes: [
      { id: 'wb-arrow-1', kind: 'arrow', x: 420, y: 260, width: 100, height: 0, color: '#64748b', groupId: null },
      { id: 'wb-arrow-2', kind: 'arrow', x: 780, y: 260, width: 100, height: 0, color: '#64748b', groupId: null },
    ],
    connectors: [],
    groups: [],
    viewport: { zoom: 1, panX: 0, panY: 0 },
  };
}

function whiteboardFlow(projectId: string) {
  return {
    projectId,
    strokes: [],
    notes: [
      { id: 'wb-flow-1', x: 120, y: 300, width: 180, height: 120, color: '#fef08a', text: '1. Login', groupId: null },
      { id: 'wb-flow-2', x: 360, y: 300, width: 180, height: 120, color: '#bbf7d0', text: '2. Dashboard', groupId: null },
      { id: 'wb-flow-3', x: 600, y: 300, width: 180, height: 120, color: '#bfdbfe', text: '3. Tasks', groupId: null },
      { id: 'wb-flow-4', x: 840, y: 300, width: 180, height: 120, color: '#fbcfe8', text: '4. Ship', groupId: null },
    ],
    shapes: [
      { id: 'wb-flow-a1', kind: 'arrow', x: 300, y: 360, width: 60, height: 0, color: '#6366f1', groupId: null },
      { id: 'wb-flow-a2', kind: 'arrow', x: 540, y: 360, width: 60, height: 0, color: '#6366f1', groupId: null },
      { id: 'wb-flow-a3', kind: 'arrow', x: 780, y: 360, width: 60, height: 0, color: '#6366f1', groupId: null },
    ],
    connectors: [],
    groups: [],
    viewport: { zoom: 1, panX: -40, panY: 0 },
  };
}

async function clearWorkspaceData(workspaceId: string, userIds: string[]) {
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditEvent.deleteMany({ where: { workspaceId } });
  await prisma.aiMessage.deleteMany({ where: { conversation: { workspaceId } } });
  await prisma.aiConversation.deleteMany({ where: { workspaceId } });
  await prisma.aiMemory.deleteMany({ where: { workspaceId } });
  await prisma.embedding.deleteMany({ where: { workspaceId } });
  await prisma.integration.deleteMany({ where: { workspaceId } });
  await prisma.file.deleteMany({ where: { workspaceId } });
  await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { task: { project: { workspaceId } } },
        { authorId: { in: userIds } },
      ],
    },
  });
  await prisma.taskDependency.deleteMany({
    where: { from: { project: { workspaceId } } },
  });
  await prisma.task.deleteMany({ where: { project: { workspaceId } } });
  await prisma.sprint.deleteMany({ where: { project: { workspaceId } } });
  await prisma.milestone.deleteMany({ where: { project: { workspaceId } } });
  await prisma.documentRevision.deleteMany({ where: { document: { workspaceId } } });
  await prisma.document.deleteMany({ where: { workspaceId } });
  await prisma.documentFolder.deleteMany({ where: { workspaceId } });
  await prisma.whiteboard.deleteMany({ where: { project: { workspaceId } } });
  await prisma.project.deleteMany({ where: { workspaceId } });
  await prisma.client.deleteMany({ where: { workspaceId } });
}

async function main() {
  const passwordHash = await argon2.hash('devos12345');

  const owner = await prisma.user.upsert({
    where: { email: 'owner@devos.local' },
    update: { passwordHash, name: 'DevOS Owner' },
    create: {
      id: IDS.owner,
      email: 'owner@devos.local',
      name: 'DevOS Owner',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash,
      avatarUrl: null,
    },
  });

  const dev1 = await prisma.user.upsert({
    where: { email: 'dev1@devos.local' },
    update: { passwordHash, name: 'Alex Dev' },
    create: {
      id: IDS.dev1,
      email: 'dev1@devos.local',
      name: 'Alex Dev',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash,
    },
  });

  const dev2 = await prisma.user.upsert({
    where: { email: 'dev2@devos.local' },
    update: { passwordHash, name: 'Maria Frontend' },
    create: {
      id: IDS.dev2,
      email: 'dev2@devos.local',
      name: 'Maria Frontend',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'pm@devos.local' },
    update: { passwordHash, name: 'Ivan PM' },
    create: {
      id: IDS.manager,
      email: 'pm@devos.local',
      name: 'Ivan PM',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash,
    },
  });

  const teamIds = [owner.id, dev1.id, dev2.id, manager.id];

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'devos' },
    update: { name: 'DevOS', ownerId: owner.id },
    create: {
      id: IDS.workspace,
      name: 'DevOS',
      slug: 'devos',
      ownerId: owner.id,
    },
  });

  await clearWorkspaceData(workspace.id, teamIds);

  const members: { userId: string; role: WorkspaceRole }[] = [
    { userId: owner.id, role: WorkspaceRole.OWNER },
    { userId: manager.id, role: WorkspaceRole.ADMIN },
    { userId: dev1.id, role: WorkspaceRole.DEVELOPER },
    { userId: dev2.id, role: WorkspaceRole.DEVELOPER },
  ];

  for (const m of members) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: m.userId,
        role: m.role,
        joinedAt: new Date(),
      },
    });
  }

  const clientAcme = await prisma.client.create({
    data: {
      id: IDS.clientAcme,
      workspaceId: workspace.id,
      name: 'Acme Corp',
      description: 'Ключевой enterprise-клиент',
      email: 'hello@acme.io',
      phone: '+7 (495) 123-45-67',
      contacts: clientExtra({
        contactList: [
          { id: 'c1', name: 'Анна Петрова', role: 'CTO', email: 'anna@acme.io', phone: '+7 900 111-22-33' },
          { id: 'c2', name: 'Сергей Иванов', role: 'Procurement', email: 'sergey@acme.io', phone: '+7 900 444-55-66' },
        ],
        contracts: [
          { id: 'ct1', title: 'Договор поддержки', number: 'AC-2026-01', date: '2026-01-15', notes: 'SLA 24/7' },
          { id: 'ct2', title: 'Лицензия DevOS Pro', number: 'AC-2026-02', date: '2026-03-01', notes: '50 seats' },
        ],
        files: [{ id: 'f1', kind: 'link', label: 'NDA', value: 'https://acme.io/nda.pdf', createdAt: new Date().toISOString() }],
        notes: 'Предпочитают email. Ежемесячный созвон по вторникам.',
      }),
    },
  });

  const clientStartup = await prisma.client.create({
    data: {
      id: IDS.clientStartup,
      workspaceId: workspace.id,
      name: 'Startup Labs',
      description: 'Быстрый пилот на 10 мест',
      email: 'team@startuplabs.io',
      phone: '+1 555 0100',
      contacts: clientExtra({
        contactList: [{ id: 'c3', name: 'Elena Park', role: 'Founder', email: 'elena@startuplabs.io', phone: '' }],
        contracts: [],
        files: [],
        notes: 'Интересуют AI-фичи и whiteboard.',
      }),
    },
  });

  await prisma.client.create({
    data: {
      id: IDS.clientInternal,
      workspaceId: workspace.id,
      name: 'Internal R&D',
      description: 'Внутренние эксперименты команды',
      email: 'rnd@devos.local',
      phone: '',
      contacts: clientExtra({ notes: 'Не биллится.' }),
    },
  });

  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 86400000);
  const inMonth = new Date(now.getTime() + 30 * 86400000);

  const projectCore = await prisma.project.create({
    data: {
      id: IDS.projectCore,
      workspaceId: workspace.id,
      clientId: clientAcme.id,
      name: 'DevOS Core',
      description: 'AI-first dev workspace — backend, frontend, sync.',
      type: ProjectType.SAAS,
      status: ProjectStatus.ACTIVE,
      startAt: new Date('2026-01-01'),
      dueAt: inMonth,
    },
  });

  const projectMobile = await prisma.project.create({
    data: {
      id: IDS.projectMobile,
      workspaceId: workspace.id,
      clientId: clientStartup.id,
      name: 'Mobile App',
      description: 'React Native + Tauri mobile shell',
      type: ProjectType.MOBILE,
      status: ProjectStatus.PLANNED,
      startAt: inTwoWeeks,
      dueAt: inMonth,
    },
  });

  const projectApi = await prisma.project.create({
    data: {
      id: IDS.projectApi,
      workspaceId: workspace.id,
      clientId: clientAcme.id,
      name: 'DevOS Public API',
      description: 'REST + WebSocket для интеграторов',
      type: ProjectType.API,
      status: ProjectStatus.ACTIVE,
      startAt: new Date('2026-02-01'),
      dueAt: inMonth,
    },
  });

  await prisma.project.create({
    data: {
      id: IDS.projectMarketing,
      workspaceId: workspace.id,
      name: 'Marketing Site',
      description: 'Лендинг и документация для продукта',
      type: ProjectType.WEB,
      status: ProjectStatus.ACTIVE,
      startAt: new Date('2026-01-15'),
      dueAt: inTwoWeeks,
    },
  });

  await prisma.sprint.create({
    data: {
      id: IDS.sprint1,
      projectId: projectCore.id,
      name: 'Sprint 1 — Foundation',
      goal: 'Auth, projects, docs, whiteboard sync',
      startAt: new Date('2026-06-01'),
      endAt: new Date('2026-06-14'),
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        id: IDS.milestoneV01,
        projectId: projectCore.id,
        name: 'v0.1 Alpha',
        version: '0.1.0',
        dueAt: new Date('2026-06-30'),
      },
      {
        id: IDS.milestoneV02,
        projectId: projectCore.id,
        name: 'v0.2 Beta',
        version: '0.2.0',
        dueAt: inMonth,
      },
      {
        id: 'seed-milestone-mobile-mvp',
        projectId: projectMobile.id,
        name: 'Mobile MVP',
        version: '0.1.0',
        dueAt: inMonth,
      },
    ],
  });

  await prisma.whiteboard.createMany({
    data: [
      { projectId: projectCore.id, content: whiteboardC4(projectCore.id) },
      { projectId: projectMobile.id, content: whiteboardFlow(projectMobile.id) },
      {
        projectId: projectApi.id,
        content: {
          projectId: projectApi.id,
          strokes: [],
          notes: [{ id: 'wb-api', x: 400, y: 240, width: 320, height: 160, color: '#e0e7ff', text: 'REST /api\nWebSocket /ws/collab', groupId: null }],
          shapes: [],
          connectors: [],
          groups: [],
          viewport: { zoom: 1, panX: 0, panY: 0 },
        },
      },
    ],
  });

  const folderSpecs = await prisma.documentFolder.create({
    data: { id: IDS.folderSpecs, workspaceId: workspace.id, projectId: projectCore.id, name: 'Спецификации' },
  });

  const folderApi = await prisma.documentFolder.create({
    data: { id: IDS.folderApi, workspaceId: workspace.id, projectId: projectApi.id, name: 'API Docs' },
  });

  await prisma.documentFolder.create({
    data: {
      id: IDS.folderNested,
      workspaceId: workspace.id,
      projectId: projectCore.id,
      parentId: folderSpecs.id,
      name: 'Architecture',
    },
  });

  const archHistory = [
    {
      id: 'rev-1',
      version: 1,
      title: 'Архитектура',
      content: '<h1>Архитектура DevOS</h1><p>Черновик.</p>',
      createdAt: new Date('2026-05-01').toISOString(),
      summary: 'Initial draft',
    },
  ];

  await prisma.document.create({
    data: {
      id: IDS.docArch,
      workspaceId: workspace.id,
      projectId: projectCore.id,
      folderId: IDS.folderNested,
      title: 'Архитектура',
      contentMd: docPayload({
        format: 'page',
        content: '<h1>Архитектура DevOS</h1><p>Frontend (React/Tauri) + NestJS API + PostgreSQL/pgvector.</p><ul><li>Modular monolith</li><li>JWT auth</li><li>Yjs collab</li></ul>',
        attachments: [{ id: 'att-1', kind: 'link', label: 'GitHub repo', value: 'https://github.com/devos/core', createdAt: now.toISOString() }],
        history: archHistory,
      }),
      tags: ['architecture', 'core'],
      version: 2,
    },
  });

  await prisma.documentRevision.createMany({
    data: [
      { documentId: IDS.docArch, version: 1, contentMd: docPayload({ format: 'page', content: archHistory[0]!.content as string }), authorId: owner.id },
      { documentId: IDS.docArch, version: 2, contentMd: docPayload({ format: 'page', content: '<h1>Архитектура DevOS</h1><p>Frontend (React/Tauri) + NestJS API + PostgreSQL/pgvector.</p>' }), authorId: dev1.id },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        id: IDS.docReadme,
        workspaceId: workspace.id,
        projectId: projectCore.id,
        title: 'README',
        contentMd: docPayload({
          format: 'md',
          content: '# DevOS Core\n\n## Quick start\n\n```bash\ncd backend && pnpm dev\n```\n',
        }),
        tags: ['readme', 'onboarding'],
        version: 1,
      },
      {
        id: IDS.docApi,
        workspaceId: workspace.id,
        projectId: projectApi.id,
        folderId: folderApi.id,
        title: 'Auth endpoints',
        contentMd: docPayload({
          format: 'md',
          content: '# Auth API\n\n- `POST /api/auth/login`\n- `POST /api/auth/register`\n- `GET /api/auth/me`\n',
        }),
        tags: ['api', 'auth'],
        version: 1,
      },
      {
        id: IDS.docRunbook,
        workspaceId: workspace.id,
        projectId: projectCore.id,
        title: 'Runbook: deploy',
        contentMd: docPayload({
          format: 'md',
          content: '# Deploy runbook\n\n1. `pnpm build`\n2. Migrate DB\n3. Start API\n',
        }),
        tags: ['ops', 'deploy'],
        version: 1,
      },
      {
        id: IDS.docMobile,
        workspaceId: workspace.id,
        projectId: projectMobile.id,
        title: 'Mobile UX notes',
        contentMd: docPayload({
          format: 'page',
          content: '<h2>Mobile UX</h2><p>Bottom nav, offline-first tasks cache.</p>',
        }),
        tags: ['mobile', 'ux'],
        version: 1,
      },
    ],
  });

  const taskDefs: {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    order: number;
    assigneeId?: string;
    parentId?: string;
    sprintId?: string;
    dueAt?: Date;
  }[] = [
    { id: 'seed-task-1', projectId: projectCore.id, title: 'Bootstrap monorepo', status: TaskStatus.DONE, priority: TaskPriority.HIGH, order: 0, assigneeId: dev1.id, sprintId: IDS.sprint1 },
    { id: 'seed-task-2', projectId: projectCore.id, title: 'Auth (JWT access + refresh)', status: TaskStatus.DONE, priority: TaskPriority.HIGH, order: 1, assigneeId: dev1.id, sprintId: IDS.sprint1 },
    { id: 'seed-task-3', projectId: projectCore.id, title: 'Projects CRUD + sync', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, order: 0, assigneeId: dev2.id, sprintId: IDS.sprint1, dueAt: inTwoWeeks, description: 'Frontend bootstrap + server persist' },
    { id: 'seed-task-4', projectId: projectCore.id, title: 'Documentation module', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, order: 0, assigneeId: manager.id, dueAt: inMonth, description: 'Folders, revisions, markdown/page editor' },
    { id: 'seed-task-5', projectId: projectCore.id, title: 'Whiteboard collab', status: TaskStatus.REVIEW, priority: TaskPriority.MEDIUM, order: 0, assigneeId: dev2.id, description: 'Yjs + WebSocket presence' },
    { id: 'seed-task-6', projectId: projectCore.id, title: 'AI RAG pipeline', status: TaskStatus.BACKLOG, priority: TaskPriority.CRITICAL, order: 0, description: 'pgvector + OpenAI embeddings — stub module' },
    { id: 'seed-task-7', projectId: projectCore.id, title: 'Настроить CI/CD', status: TaskStatus.TESTING, priority: TaskPriority.MEDIUM, order: 0, assigneeId: dev1.id },
    { id: 'seed-task-sub-1', projectId: projectCore.id, parentId: 'seed-task-3', title: 'Task bootstrap from API', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, order: 0, assigneeId: dev2.id },
    { id: 'seed-task-sub-2', projectId: projectCore.id, parentId: 'seed-task-3', title: 'Persist task mutations', status: TaskStatus.TODO, priority: TaskPriority.LOW, order: 1 },
    { id: 'seed-task-8', projectId: projectMobile.id, title: 'UI Kit', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM, order: 0 },
    { id: 'seed-task-9', projectId: projectMobile.id, title: 'Tauri shell POC', status: TaskStatus.TODO, priority: TaskPriority.HIGH, order: 0, assigneeId: dev2.id },
    { id: 'seed-task-10', projectId: projectApi.id, title: 'OpenAPI / Swagger fix', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, order: 0, assigneeId: dev1.id, description: 'Schema generation currently fails on boot' },
    { id: 'seed-task-11', projectId: projectApi.id, title: 'Rate limiting', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM, order: 0 },
    { id: 'seed-task-12', projectId: IDS.projectMarketing, title: 'Landing hero section', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, order: 0, assigneeId: manager.id },
    { id: 'seed-task-13', projectId: IDS.projectMarketing, title: 'Pricing page', status: TaskStatus.TODO, priority: TaskPriority.LOW, order: 0 },
  ];

  for (const t of taskDefs) {
    await prisma.task.create({
      data: {
        id: t.id,
        projectId: t.projectId,
        authorId: owner.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        order: t.order,
        assigneeId: t.assigneeId,
        parentId: t.parentId,
        sprintId: t.sprintId,
        dueAt: t.dueAt,
      },
    });
  }

  await prisma.taskDependency.createMany({
    data: [
      { fromId: 'seed-task-3', toId: 'seed-task-2' },
      { fromId: 'seed-task-4', toId: 'seed-task-3' },
      { fromId: 'seed-task-6', toId: 'seed-task-4' },
      { fromId: 'seed-task-10', toId: 'seed-task-2' },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { id: 'seed-comment-1', targetKind: CommentTarget.TASK, targetId: 'seed-task-3', authorId: dev1.id, body: 'Bootstrap готов, можно подключать tasks sync.' },
      { id: 'seed-comment-2', targetKind: CommentTarget.TASK, targetId: 'seed-task-3', authorId: manager.id, body: 'Не забудьте про subtasks и dependencies в UI.' },
      { id: 'seed-comment-3', targetKind: CommentTarget.TASK, targetId: 'seed-task-6', authorId: owner.id, body: 'AI module пока stub — нужен BullMQ worker.' },
      { id: 'seed-comment-4', targetKind: CommentTarget.TASK, targetId: 'seed-task-5', authorId: dev2.id, body: 'Whiteboard Yjs sync работает в dev.' },
      { id: 'seed-comment-5', targetKind: CommentTarget.TASK, targetId: 'seed-task-10', authorId: dev1.id, body: 'Swagger schema generation падает — см. main.ts.' },
    ],
  });

  await prisma.file.createMany({
    data: [
      { id: 'seed-file-1', workspaceId: workspace.id, projectId: projectCore.id, taskId: 'seed-task-3', name: 'sync-diagram.png', mimeType: 'image/png', size: 48200, storageKey: 'seed/devos/sync-diagram.png', checksum: 'abc123' },
      { id: 'seed-file-2', workspaceId: workspace.id, projectId: projectApi.id, name: 'openapi-draft.json', mimeType: 'application/json', size: 12400, storageKey: 'seed/devos/openapi-draft.json' },
      { id: 'seed-file-3', workspaceId: workspace.id, projectId: projectCore.id, name: 'architecture.pdf', mimeType: 'application/pdf', size: 256000, storageKey: 'seed/devos/architecture.pdf' },
    ],
  });

  await prisma.integration.createMany({
    data: [
      {
        id: IDS.integrationGithub,
        workspaceId: workspace.id,
        provider: IntegrationProvider.GITHUB,
        externalId: 'devos/core',
        accessToken: 'gho_seed_token_placeholder',
        scopes: ['repo', 'read:org'],
        metadata: { login: 'devos-team', repos: ['devos/core', 'devos/mobile'] },
        connectedById: owner.id,
      },
      {
        id: IDS.integrationGitlab,
        workspaceId: workspace.id,
        provider: IntegrationProvider.GITLAB,
        externalId: 'devos/platform',
        accessToken: 'glpat_seed_token_placeholder',
        scopes: ['api', 'read_repository'],
        metadata: { host: 'gitlab.com', group: 'devos' },
        connectedById: dev1.id,
      },
      {
        id: IDS.integrationFigma,
        workspaceId: workspace.id,
        provider: IntegrationProvider.FIGMA,
        externalId: 'figma-file-abc',
        accessToken: 'figd_seed_token_placeholder',
        scopes: ['files:read'],
        metadata: { fileName: 'DevOS Design System', url: 'https://figma.com/file/abc' },
        connectedById: dev2.id,
      },
    ],
  });

  await prisma.aiConversation.create({
    data: {
      id: IDS.aiConv,
      workspaceId: workspace.id,
      projectId: projectCore.id,
      userId: owner.id,
      title: 'Архитектура RAG',
      messages: {
        create: [
          { role: AiRole.USER, content: 'Как лучше организовать RAG для DevOS?', tokens: 12 },
          {
            role: AiRole.ASSISTANT,
            content: 'Рекомендую pgvector + chunking документов/tasks. Worker на BullMQ, API остаётся тонким.',
            tokens: 28,
            sources: [{ type: 'document', id: IDS.docArch, title: 'Архитектура' }],
          },
          { role: AiRole.USER, content: 'А GitHub indexing?', tokens: 6 },
          {
            role: AiRole.ASSISTANT,
            content: 'Отдельный sync worker в github module. Webhooks → queue → embeddings.',
            tokens: 18,
          },
        ],
      },
    },
  });

  await prisma.aiMemory.createMany({
    data: [
      { id: 'seed-memory-1', workspaceId: workspace.id, projectId: projectCore.id, kind: 'architecture', content: 'Modular monolith NestJS, не микросервисы на v0.1', metadata: { author: 'owner' } },
      { id: 'seed-memory-2', workspaceId: workspace.id, kind: 'decision', content: 'JWT access 15m + refresh 30d', metadata: { date: '2026-01-10' } },
      { id: 'seed-memory-3', workspaceId: workspace.id, projectId: projectCore.id, kind: 'stack', content: 'React 18 + Tauri v2 + TanStack Query + Zustand', metadata: {} },
    ],
  });

  await prisma.embedding.createMany({
    data: [
      { id: 'seed-embed-1', workspaceId: workspace.id, projectId: projectCore.id, source: EmbeddingSource.DOCUMENT, sourceId: IDS.docArch, chunkIndex: 0, content: 'DevOS architecture: React frontend, NestJS API, PostgreSQL with pgvector.', tokens: 20 },
      { id: 'seed-embed-2', workspaceId: workspace.id, projectId: projectCore.id, source: EmbeddingSource.TASK, sourceId: 'seed-task-6', chunkIndex: 0, content: 'AI RAG pipeline with OpenAI embeddings and pgvector index.', tokens: 15 },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { id: 'seed-notif-1', userId: owner.id, kind: 'task', title: 'Задача в review', body: 'Whiteboard collab ждёт вашего review', data: { projectId: projectCore.id, taskId: 'seed-task-5' } },
      { id: 'seed-notif-2', userId: owner.id, kind: 'deadline', title: 'Дедлайн через 14 дней', body: 'Projects CRUD + sync', data: { taskId: 'seed-task-3' }, readAt: null },
      { id: 'seed-notif-3', userId: owner.id, kind: 'info', title: 'Demo seed applied', body: 'Тестовые данные обновлены', readAt: new Date() },
      { id: 'seed-notif-4', userId: dev1.id, kind: 'mention', title: 'Комментарий к задаче', body: 'PM оставил комментарий', data: { taskId: 'seed-task-3' } },
    ],
  });

  await prisma.auditEvent.createMany({
    data: [
      { id: 'seed-audit-1', workspaceId: workspace.id, userId: owner.id, action: 'seed.apply', target: 'workspace', targetId: workspace.id, meta: { version: 'full-demo' } },
      { id: 'seed-audit-2', workspaceId: workspace.id, userId: dev1.id, action: 'task.update', target: 'task', targetId: 'seed-task-3', meta: { status: 'IN_PROGRESS' } },
      { id: 'seed-audit-3', workspaceId: workspace.id, userId: manager.id, action: 'document.create', target: 'document', targetId: IDS.docRunbook, meta: { title: 'Runbook: deploy' } },
      { id: 'seed-audit-4', workspaceId: workspace.id, userId: owner.id, action: 'integration.connect', target: 'integration', targetId: IDS.integrationGithub, meta: { provider: 'GITHUB' } },
    ],
  });

  console.info('✓ Full demo seed complete');
  console.info('  login:    owner@devos.local / devos12345');
  console.info('  team:     dev1@, dev2@, pm@devos.local (same password)');
  console.info('  workspace: devos');
  console.info(`  projects: 4 | clients: 3 | tasks: ${taskDefs.length}`);
  console.info('  docs: 5 | folders: 3 | whiteboards: 3');
  console.info('  integrations: 3 | ai: 1 conv + 3 memories');
  console.info('  notifications: 4 | audit: 4 | files: 3');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
