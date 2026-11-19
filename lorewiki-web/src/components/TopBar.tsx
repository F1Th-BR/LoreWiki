import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_MODE } from '../api';
import { useAuth } from '../auth/AuthContext';

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('lorewiki.theme') as 'dark' | 'light') || 'dark',
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('lorewiki.theme', theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))] as const;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, toggle] = useTheme();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden>◈</span> LoreWiki
      </Link>
      {API_MODE === 'mock' && (
        <span className="pill" title="Os dados ficam só neste navegador (localStorage)">
          modo demonstração
        </span>
      )}
      <nav className="topbar-right">
        <button className="link-btn" onClick={toggle} aria-label="Alternar tema claro/escuro" title="Alternar tema">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        {user ? (
          <>
            <span className="muted user-email" title={user.email}>
              {user.email}
            </span>
            <button
              className="link-btn"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/register">Criar conta</Link>
            <Link to="/login">Entrar</Link>
          </>
        )}
      </nav>
    </header>
  );
}
