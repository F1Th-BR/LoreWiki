import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { DiffView } from '../components/DiffView';
import { PageTabs } from '../components/PageTabs';
import { ErrorBox, Loading } from '../components/Status';
import { useWorld } from '../components/world-context';
import { fmtDate, useAsync } from '../lib/useAsync';

/** Histórico (RF-15/16/17/18): lista de revisões, diff entre duas quaisquer e restauração. */
export function PageHistory() {
  const { world, refresh } = useWorld();
  const { user } = useAuth();
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const base = `/w/${world.id}/p/${slug}`;

  const page = useAsync(() => api.getPage(world.id, slug), [world.id, slug, user?.id]);
  const revs = useAsync(() => api.listRevisions(world.id, slug), [world.id, slug]);
  const [from, setFrom] = useState<number>(-1);
  const [to, setTo] = useState<number>(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();

  // Estados da página, do mais novo ao mais antigo; o último é o estado inicial (antes da 1ª revisão).
  const states = revs.data
    ? [
        ...revs.data.map((r) => ({ id: r.id, text: r.contentAfter, rev: r })),
        ...(revs.data.length ? [{ id: 'initial', text: revs.data[revs.data.length - 1].contentBefore, rev: null }] : []),
      ]
    : [];

  useEffect(() => {
    if (states.length) {
      setTo(0);
      setFrom(Math.min(1, states.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revs.data]);

  const restore = async (revisionId: string) => {
    if (!window.confirm('Restaurar esta revisão? Uma nova revisão será criada; o histórico é preservado.')) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.restoreRevision(world.id, slug, revisionId);
      refresh();
      navigate(base);
    } catch (e) {
      setError(e as Error);
      setBusy(false);
    }
  };

  if (page.loading || revs.loading) return <Loading />;
  if (page.error || revs.error) return <div className="panel"><ErrorBox error={(page.error ?? revs.error)!} /></div>;

  const p = page.data!;
  const a = states[from];
  const b = states[to];

  return (
    <>
      <PageTabs base={base} canEdit={p.canEdit} />
      <article className="panel">
        <h1>Histórico: {p.title}</h1>
        {error && <ErrorBox error={error} />}
        {revs.data!.length === 0 ? (
          <p className="muted">Esta página ainda não tem revisões registradas.</p>
        ) : (
          <>
            <table className="history">
              <thead>
                <tr>
                  <th scope="col">De</th>
                  <th scope="col">Para</th>
                  <th scope="col">Quando</th>
                  <th scope="col">Quem</th>
                  <th scope="col">Resumo</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {states.map((s, i) => (
                  <tr key={s.id} className={i === to || i === from ? 'sel' : undefined}>
                    <td><input type="radio" name="from" aria-label="Comparar a partir daqui" checked={from === i} onChange={() => setFrom(i)} /></td>
                    <td><input type="radio" name="to" aria-label="Comparar até aqui" checked={to === i} onChange={() => setTo(i)} /></td>
                    <td>{s.rev ? fmtDate(s.rev.createdAt) : <em>Estado inicial</em>}</td>
                    <td>{s.rev ? s.rev.userName ?? 'Usuário' : '—'}</td>
                    <td>{s.rev?.summary ?? <span className="muted">—</span>}</td>
                    <td>
                      {s.rev && i !== 0 && p.canRestore && (
                        <button className="link-btn" disabled={busy} onClick={() => restore(s.rev!.id)}>
                          Restaurar
                        </button>
                      )}
                      {i === 0 && <span className="pill">atual</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>Diferenças</h2>
            {a && b && <DiffView before={a.text} after={b.text} />}
          </>
        )}
        <p><Link to={base}>← Voltar à página</Link></p>
      </article>
    </>
  );
}
