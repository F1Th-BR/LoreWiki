import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { TopBar } from './components/TopBar';
import { WorldLayout } from './components/WorldLayout';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { Home } from './pages/Home';
import { NewWorld } from './pages/NewWorld';
import { PageEdit } from './pages/PageEdit';
import { PageHistory } from './pages/PageHistory';
import { PageView } from './pages/PageView';
import { SearchPage } from './pages/SearchPage';
import { WorldHome } from './pages/WorldHome';
import { WorldIndex } from './pages/WorldIndex';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  return user ? <>{children}</> : <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
}

function NotFound() {
  return (
    <div className="container narrow">
      <div className="panel">
        <h1>Página não encontrada</h1>
        <p><Link to="/">Voltar ao início</Link></p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/worlds/new" element={<RequireAuth><NewWorld /></RequireAuth>} />

        <Route path="/w/:worldId" element={<WorldLayout />}>
          <Route index element={<WorldHome />} />
          <Route path="index" element={<WorldIndex />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="new" element={<RequireAuth><PageEdit mode="new" /></RequireAuth>} />
          <Route path="p/:slug" element={<PageView />} />
          <Route path="p/:slug/edit" element={<RequireAuth><PageEdit mode="edit" /></RequireAuth>} />
          <Route path="p/:slug/history" element={<PageHistory />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="site-foot">LoreWiki · documente seus mundos</footer>
    </>
  );
}
