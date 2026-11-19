import { useNavigate } from 'react-router-dom';

/** Renderiza HTML já sanitizado e faz os links internos navegarem sem recarregar a página. */
export function Html({ html, inline = false }: { html: string; inline?: boolean }) {
  const navigate = useNavigate();
  const Tag = inline ? 'span' : 'div';

  const onClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (a && href && href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  };

  return <Tag className={inline ? undefined : 'prose'} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
