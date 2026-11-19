import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox } from '../components/Status';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Error>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // A API responde 401 sem corpo, de propósito, sem dizer se foi e-mail ou senha.
      setError(err instanceof ApiError && err.status === 401 ? new Error('E-mail ou senha incorretos.') : (err as Error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <form className="panel form" onSubmit={submit}>
        <h1>Entrar</h1>
        {error && <ErrorBox error={error} />}
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <p className="muted">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
        {import.meta.env.VITE_API_MODE !== 'real' && (
          <p className="notice">Modo demonstração: use <code>demo@lorewiki.dev</code> / <code>demo1234</code> (criador do mundo de exemplo).</p>
        )}
      </form>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Error>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(new Error('A senha precisa ter pelo menos 8 caracteres.'));
    setBusy(true);
    setError(undefined);
    try {
      await register(username, email, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <form className="panel form" onSubmit={submit}>
        <h1>Criar conta</h1>
        {error && <ErrorBox error={error} />}
        <label>
          Nome de usuário
          <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} autoFocus autoComplete="username" />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Senha <small className="muted">(mínimo 8 caracteres)</small>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Criando…' : 'Criar conta'}</button>
        <p className="muted">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
