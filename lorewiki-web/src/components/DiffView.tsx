import { diffLines } from 'diff';

const CONTEXT = 3; // linhas iguais mantidas ao redor de cada mudança

interface Row {
  kind: 'add' | 'del' | 'same' | 'gap';
  text: string;
}

/** Diff linha a linha entre duas versões do texto (RF-17), recolhendo trechos longos sem mudanças. */
export function DiffView({ before, after }: { before: string; after: string }) {
  if (before === after) return <p className="muted">Sem diferenças.</p>;

  const rows: Row[] = [];
  const parts = diffLines(before, after);
  parts.forEach((p, i) => {
    const lines = p.value.replace(/\n$/, '').split('\n');
    if (p.added || p.removed) {
      lines.forEach((text) => rows.push({ kind: p.added ? 'add' : 'del', text }));
      return;
    }
    const head = i === 0 ? 0 : CONTEXT;
    const tail = i === parts.length - 1 ? 0 : CONTEXT;
    if (lines.length <= head + tail + 1) {
      lines.forEach((text) => rows.push({ kind: 'same', text }));
    } else {
      lines.slice(0, head).forEach((text) => rows.push({ kind: 'same', text }));
      rows.push({ kind: 'gap', text: `⋯ ${lines.length - head - tail} linhas iguais ⋯` });
      lines.slice(lines.length - tail).forEach((text) => rows.push({ kind: 'same', text }));
    }
  });

  return (
    <pre className="diff" aria-label="Diferenças">
      {rows.map((r, i) => (
        <span key={i} className={`diff-line ${r.kind}`}>
          <span className="diff-mark">{r.kind === 'add' ? '+' : r.kind === 'del' ? '−' : ' '}</span>
          {r.text || ' '}
        </span>
      ))}
    </pre>
  );
}
