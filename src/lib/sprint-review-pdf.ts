import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '@/shared/types';
import type { Task } from '@/shared/types';

export function exportSprintReviewPdf(input: {
  project: Project;
  tasks: Task[];
  sprintName?: string;
}) {
  const doc = new jsPDF();
  const root = input.tasks.filter((t) => t.projectId === input.project.id && t.parentId === null);
  const done = root.filter((t) => t.done);
  const open = root.filter((t) => !t.done);

  doc.setFontSize(16);
  doc.text(`Sprint Review — ${input.project.name}`, 14, 18);
  doc.setFontSize(10);
  doc.text(input.sprintName ?? new Date().toLocaleDateString('ru-RU'), 14, 26);
  doc.text(`Закрыто: ${done.length} · Открыто: ${open.length}`, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [['Задача', 'Статус', 'Приоритет', 'Estimate', 'Spent']],
    body: root.map((t) => [
      t.title || '—',
      t.status,
      t.priority,
      t.estimateMinutes != null ? `${t.estimateMinutes}m` : '—',
      t.spentMinutes != null ? `${t.spentMinutes}m` : '—',
    ]),
  });

  doc.save(`sprint-review-${input.project.id}.pdf`);
}

export function exportTimeTrackingPdf(tasks: Task[], projectName: string) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Time tracking vs estimate — ${projectName}`, 14, 16);
  const rows = tasks
    .filter((t) => t.parentId === null && (t.estimateMinutes || t.spentMinutes))
    .map((t) => {
      const est = t.estimateMinutes ?? 0;
      const spent = t.spentMinutes ?? 0;
      const delta = spent - est;
      return [t.title || '—', String(est), String(spent), delta > 0 ? `+${delta}` : String(delta)];
    });
  autoTable(doc, {
    startY: 24,
    head: [['Задача', 'Estimate (min)', 'Spent (min)', 'Δ']],
    body: rows,
  });
  doc.save(`time-tracking-${Date.now()}.pdf`);
}
