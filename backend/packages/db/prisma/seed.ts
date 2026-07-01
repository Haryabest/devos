/**
 * Dev seed — minimal set: 1 owner, 1 workspace, 1 project, а few tasks.
 * Idempotent by unique keys.
 */
import { PrismaClient, WorkspaceRole, ProjectType, ProjectStatus, TaskStatus, TaskPriority, UserKind } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

function fakePasswordHash(password: string) {
  // NOTE: real hashing lives in apps/api (argon2). Seed uses sha256 for a placeholder.
  return `dev$${createHash('sha256').update(password).digest('hex')}`;
}

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: 'owner@devos.local' },
    update: {},
    create: {
      email: 'owner@devos.local',
      name: 'DevOS Owner',
      kind: UserKind.USER,
      emailVerified: true,
      passwordHash: fakePasswordHash('devos12345'),
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

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-devos' },
    update: {},
    create: {
      id: 'seed-project-devos',
      workspaceId: workspace.id,
      name: 'DevOS Core',
      description: 'AI-first dev workspace.',
      type: ProjectType.SAAS,
      status: ProjectStatus.ACTIVE,
    },
  });

  const tasks = [
    { title: 'Bootstrap monorepo', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
    { title: 'Auth (JWT access + refresh)', status: TaskStatus.TODO, priority: TaskPriority.HIGH },
    { title: 'Projects CRUD', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    { title: 'Tasks Kanban', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM },
    { title: 'AI chat with RAG', status: TaskStatus.BACKLOG, priority: TaskPriority.CRITICAL },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        projectId: project.id,
        authorId: owner.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
      },
    });
  }

  console.info(`✓ seed: ${owner.email} / workspace=${workspace.slug} / project=${project.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
