/**
 * Dev seed — owner, workspace, projects, clients, tasks, documents.
 * Login: owner@devos.local / devos12345
 */
import {
  PrismaClient,
  WorkspaceRole,
  ProjectType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  UserKind,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function clientExtra(data: {
  contactList?: unknown[];
  contracts?: unknown[];
  files?: unknown[];
  notes?: string;
}) {
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
}) {
  return JSON.stringify({
    format: data.format,
    content: data.content,
    fileData: null,
    fileName: null,
    mimeType: null,
    attachments: data.attachments ?? [],
    history: data.history ?? [],
  });
}

async function main() {
  const passwordHash = await argon2.hash('devos12345');

  const owner = await prisma.user.upsert({
    where: { email: 'owner@devos.local' },
    update: { passwordHash, name: 'DevOS Owner' },
    create: {
      email: 'owner@devos.local',
      name: 'DevOS Owner',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'devos' },
    update: {},
    create: {
      name: 'DevOS',
      slug: 'devos',
      ownerId: owner.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: owner.id } },
    update: { role: WorkspaceRole.OWNER },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: WorkspaceRole.OWNER,
      joinedAt: new Date(),
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-acme' },
    update: {},
    create: {
      id: 'seed-client-acme',
      workspaceId: workspace.id,
      name: 'Acme Corp',
      description: 'Ключевой enterprise-клиент',
      email: 'hello@acme.io',
      phone: '+7 (495) 123-45-67',
      contacts: clientExtra({
        contactList: [
          {
            id: 'c1',
            name: 'Анна Петрова',
            role: 'CTO',
            email: 'anna@acme.io',
            phone: '+7 900 111-22-33',
          },
        ],
        contracts: [
          {
            id: 'ct1',
            title: 'Договор поддержки',
            number: 'AC-2026-01',
            date: '2026-01-15',
            notes: 'SLA 24/7',
          },
        ],
        files: [],
        notes: 'Предпочитают email. Ежемесячный созвон по вторникам.',
      }),
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-devos' },
    update: { clientId: client.id },
    create: {
      id: 'seed-project-devos',
      workspaceId: workspace.id,
      clientId: client.id,
      name: 'DevOS Core',
      description: 'AI-first dev workspace.',
      type: ProjectType.SAAS,
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-project-mobile' },
    update: {},
    create: {
      id: 'seed-project-mobile',
      workspaceId: workspace.id,
      name: 'Mobile App',
      description: 'React Native клиент',
      type: ProjectType.MOBILE,
      status: ProjectStatus.PLANNED,
    },
  });

  await prisma.task.deleteMany({ where: { projectId: { in: [project.id, project2.id] } } });

  const tasks = [
    { projectId: project.id, title: 'Bootstrap monorepo', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
    { projectId: project.id, title: 'Auth (JWT access + refresh)', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
    { projectId: project.id, title: 'Projects CRUD', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM },
    { projectId: project.id, title: 'Documentation module', status: TaskStatus.TODO, priority: TaskPriority.HIGH },
    { projectId: project2.id, title: 'UI Kit', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        projectId: t.projectId,
        authorId: owner.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
      },
    });
  }

  await prisma.document.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.documentFolder.deleteMany({ where: { workspaceId: workspace.id } });

  const folder = await prisma.documentFolder.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      name: 'Спецификации',
    },
  });

  await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      folderId: folder.id,
      title: 'Архитектура',
      contentMd: docPayload({
        format: 'page',
        content: '<h1>Архитектура DevOS</h1><p>Frontend + NestJS API + PostgreSQL.</p>',
        attachments: [],
        history: [],
      }),
      tags: ['architecture', 'core'],
      version: 1,
    },
  });

  await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      title: 'README',
      contentMd: docPayload({
        format: 'md',
        content: '# DevOS\n\nДокументация проекта.\n',
        attachments: [],
        history: [],
      }),
      tags: ['readme'],
      version: 1,
    },
  });

  console.info(`✓ seed complete`);
  console.info(`  login: owner@devos.local / devos12345`);
  console.info(`  workspace: ${workspace.slug}`);
  console.info(`  projects: ${project.name}, ${project2.name}`);
  console.info(`  client: ${client.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
