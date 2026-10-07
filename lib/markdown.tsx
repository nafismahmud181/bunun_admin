import type { ReactNode } from 'react';

// The small Markdown subset used for store pages. The storefront has the same renderer
// (frontend/lib/markdown.tsx), so this preview matches what shoppers see. It builds React
// elements (never raw HTML), and only allows store paths, https, mailto: and tel: links.
//
//   ## Heading      ### Smaller heading
//   - list item     (consecutive lines form one list)
//   **bold**        [link text](/shop) or [email us](mailto:hello@example.com)
//   Blank lines separate paragraphs; single line breaks are kept.

// Paths may not start with // or /\ (browsers read both as a link to another site).
const SAFE_HREF = /^(\/(?![/\\])|https:\/\/|mailto:|tel:)/;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${key}-${i++}`}>{m[1]}</strong>);
    else if (SAFE_HREF.test(m[3]!))
      out.push(
        <a
          key={`${key}-${i++}`}
          href={m[3]}
          {...(m[3]!.startsWith('https://') && { target: '_blank', rel: 'noreferrer' })}
        >
          {m[2]}
        </a>,
      );
    else out.push(m[2]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(source: string): ReactNode[] {
  const blocks = source.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, b) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) {
        const k = `p${b}-${out.length}`;
        out.push(
          <p key={k}>
            {para.flatMap((l, j) =>
              j ? [<br key={`${k}-br${j}`} />, ...inline(l, `${k}-${j}`)] : inline(l, `${k}-${j}`),
            )}
          </p>,
        );
        para = [];
      }
      if (list.length) {
        const k = `ul${b}-${out.length}`;
        out.push(
          <ul key={k}>
            {list.map((l, j) => (
              <li key={j}>{inline(l, `${k}-${j}`)}</li>
            ))}
          </ul>,
        );
        list = [];
      }
    };
    for (const raw of lines) {
      const line = raw.trim();
      const heading = /^(#{2,3})\s+(.*)$/.exec(line);
      if (heading) {
        flush();
        const k = `h${b}-${out.length}`;
        out.push(
          heading[1] === '##' ? <h2 key={k}>{inline(heading[2]!, k)}</h2> : <h3 key={k}>{inline(heading[2]!, k)}</h3>,
        );
      } else if (/^[-*]\s+/.test(line)) {
        if (para.length) flush();
        list.push(line.replace(/^[-*]\s+/, ''));
      } else {
        if (list.length) flush();
        para.push(line);
      }
    }
    flush();
  });
  return out;
}
