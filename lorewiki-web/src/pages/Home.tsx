import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox, Loading } from '../components/Status';
import { useAsync } from '../lib/useAsync';

export function Home() {
  const { user } = useAuth();
  const worlds = useAsync(() => api.listWorlds(), []);

  return (
    <div className="container">
      <section className="hero">
        <h1>Bem-vindo ao LoreWiki</h1>
        <p>
          Documente, consulte e construa em grupo o lore dos mundos das suas campanhas de RPG.
        </p>
        {user ? (
          <Link className="btn" to="/worlds/new">＋ Criar um mundo</Link>
        ) : (
          <Link className="btn" to="/register">Criar conta para começar</Link>
        )}
      </section>

      <h2>Mundos públicos</h2>
      {worlds.loading && <Loading />}
      {worlds.error && <ErrorBox error={worlds.error} />}
      {worlds.data && worlds.data.length === 0 && (
        <p className="muted">Nenhum mundo público ainda. Que tal criar o primeiro?</p>
      )}
      <div className="grid">
        {worlds.data?.map((w) => (
          <Link key={w.id} to={`/w/${w.id}`} className="card">
            <h3>{w.name}</h3>
            <p>{w.description || 'Sem descrição.'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
