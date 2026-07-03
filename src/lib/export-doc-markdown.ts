import type { Doc } from '@/shared/types';

export function exportDocAsMarkdown(doc: Doc) {
  const title = doc.title?.trim() || 'document';
  const slug = title.replace(/[^\w\u0400-\u04FF-]+/g, '-').replace(/^-|-$/g, '') || 'document';
  const body = doc.format === 'page' ? stripHtml(doc.content) : doc.content;
  const md = `# ${title}\n\n${body}\n`;
  downloadText(`${slug}.md`, md, 'text/markdown;charset=utf-8');
}

function stripHtml(html: string) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent ?? '';
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
