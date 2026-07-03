import type { Client } from '@/shared/types';
import type { Project } from '@/shared/types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function openClientReportPdf(client: Client, projects: Project[]) {
  const linked = projects.filter((p) => p.clientId === client.id);
  const now = new Date();
  const rows = linked.map((p) => {
    const days = p.dueAt ? differenceInCalendarDays(parseISO(p.dueAt), now) : null;
    return `<tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.status)}</td>
      <td>${p.dueAt ? new Date(p.dueAt).toLocaleDateString('ru-RU') : '—'}</td>
      <td>${days === null ? '—' : days < 0 ? 'просрочен' : `${days} дн.`}</td>
    </tr>`;
  });

  const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/><title>Отчёт — ${escapeHtml(client.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  p.meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f4f4f5; }
</style></head><body>
  <h1>Отчёт для клиента: ${escapeHtml(client.name)}</h1>
  <p class="meta">DevOS · ${now.toLocaleString('ru-RU')}</p>
  <table>
    <thead><tr><th>Проект</th><th>Статус</th><th>Дедлайн</th><th>До срока</th></tr></thead>
    <tbody>${rows.join('') || '<tr><td colspan="4">Нет проектов</td></tr>'}</tbody>
  </table>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
