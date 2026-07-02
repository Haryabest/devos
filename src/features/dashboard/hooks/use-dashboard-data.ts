import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import type { ActivityItem, Recommendation } from '@/features/dashboard/types';

export function useDashboardData() {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const docs = useDocsStore((s) => s.docs);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const openTasks = tasks.filter((t) => !t.done && t.parentId === null);
  const criticalTasks = openTasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH');

  const healthCounts = useMemo(() => {
    const c = { GREEN: 0, YELLOW: 0, RED: 0 };
    for (const p of projects) c[p.health]++;
    return c;
  }, [projects]);

  const activity = useMemo(() => {
    const items: ActivityItem[] = [];
    for (const t of tasks.filter((x) => x.parentId === null)) {
      const p = projects.find((pr) => pr.id === t.projectId);
      items.push({
        id: `task-${t.id}`,
        kind: 'task',
        title: t.title,
        projectName: p?.name,
        projectId: t.projectId,
        at: t.createdAt,
      });
    }
    for (const d of docs) {
      const p = projects.find((pr) => pr.id === d.projectId);
      items.push({
        id: `doc-${d.id}`,
        kind: 'doc',
        title: d.title || 'Без названия',
        projectName: p?.name,
        projectId: d.projectId,
        at: d.updatedAt,
      });
    }
    for (const p of projects) {
      items.push({
        id: `project-${p.id}`,
        kind: 'project',
        title: p.name,
        projectId: p.id,
        at: p.createdAt,
      });
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
  }, [tasks, docs, projects]);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];

    const noGit = projects.filter((p) => !p.links?.git && p.status === 'ACTIVE');
    if (noGit.length > 0) {
      recs.push({
        text: `${noGit.length} активных проектов без Git — AI не видит коммиты.`,
        action: () => navigate(`/projects/${noGit[0]!.id}`),
        label: 'Подключить',
      });
    }

    const noDocs = projects.filter(
      (p) => p.status === 'ACTIVE' && docs.filter((d) => d.projectId === p.id).length === 0,
    );
    if (noDocs.length > 0) {
      recs.push({
        text: `${noDocs.length} проектов без документации — добавьте для RAG-контекста AI.`,
        action: () => navigate(`/projects/${noDocs[0]!.id}/docs`),
        label: 'Документация',
      });
    }

    if (criticalTasks.length > 0) {
      recs.push({
        text: `${criticalTasks.length} срочных задач требуют внимания.`,
        action: () => navigate(`/projects/${criticalTasks[0]!.projectId}/tasks`),
        label: 'Задачи',
      });
    }

    const redProjects = projects.filter((p) => p.health === 'RED');
    if (redProjects.length > 0) {
      recs.push({
        text: `${redProjects.length} проектов в красной зоне здоровья.`,
        action: () => navigate(`/projects/${redProjects[0]!.id}`),
        label: 'Открыть',
      });
    }

    if (recs.length === 0 && projects.length > 0) {
      recs.push({
        text: 'Добавьте документацию к проектам — файлы, папки и версии.',
        action: () => navigate('/documents'),
        label: 'Документация',
      });
    }

    return recs;
  }, [projects, docs, criticalTasks, navigate]);

  return {
    projects,
    tasks,
    activeProjects,
    openTasks,
    criticalTasks,
    healthCounts,
    activity,
    recommendations,
  };
}
