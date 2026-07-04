import { cn } from '@/lib/utils';

function inlineFormat(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={match.index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function renderBlock(block: string, key: number): React.ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n');
    const code = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined).join('\n');
    return (
      <pre
        key={key}
        className="my-2 overflow-x-auto rounded-md border border-border/60 bg-muted/50 p-3 font-mono text-xs"
      >
        <code>{code}</code>
      </pre>
    );
  }

  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={key} className="mb-1 mt-3 text-sm font-semibold">
        {inlineFormat(trimmed.slice(4))}
      </h3>
    );
  }
  if (trimmed.startsWith('## ')) {
    return (
      <h2 key={key} className="mb-1 mt-3 text-base font-semibold">
        {inlineFormat(trimmed.slice(3))}
      </h2>
    );
  }
  if (trimmed.startsWith('# ')) {
    return (
      <h1 key={key} className="mb-2 mt-3 text-lg font-semibold">
        {inlineFormat(trimmed.slice(2))}
      </h1>
    );
  }

  const lines = trimmed.split('\n');
  if (lines.every((l) => /^[-*]\s/.test(l))) {
    return (
      <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-sm">
        {lines.map((l, i) => (
          <li key={i}>{inlineFormat(l.replace(/^[-*]\s/, ''))}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => /^\d+\.\s/.test(l))) {
    return (
      <ol key={key} className="my-2 list-decimal space-y-1 pl-5 text-sm">
        {lines.map((l, i) => (
          <li key={i}>{inlineFormat(l.replace(/^\d+\.\s/, ''))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className="my-1 text-sm leading-relaxed">
      {lines.map((l, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {inlineFormat(l)}
        </span>
      ))}
    </p>
  );
}

type MarkdownViewProps = {
  content: string;
  className?: string;
};

export function MarkdownView({ content, className }: MarkdownViewProps) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className={cn('prose-sm max-w-none text-foreground', className)}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
