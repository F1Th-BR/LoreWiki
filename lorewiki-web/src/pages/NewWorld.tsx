import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ErrorBox } from '../components/Status';

export function NewWorld() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<Error>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const { id } = await api.createWorld({ name: name.trim(), description: description.trim() || undefined, isPublic });
      navigate(`/w/${id}`);
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <form className="panel form" onSubmit={submit}>
        <h1>Criar um mundo</h1>
        <p className="muted">Você será o Criador do Mundo: o papel de maior autoridade, único e intransferível.</p>
        {error && <ErrorBox error={error} />}
        <label>
          Nome do mundo
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoFocus />
        </label>
        <label>
          Descrição
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </label>
        <label className="check">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Mundo público (qualquer pessoa pode ler as páginas publicadas)
        </label>
        <button className="btn" disabled={busy || !name.trim()}>{busy ? 'Criando…' : 'Criar mundo'}</button>
      </form>
    </div>
  );
}
