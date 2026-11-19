export const TOKEN_KEY = 'lorewiki.token';
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** 409: alguém editou a página enquanto você editava (RN-11). */
export class ConflictError extends ApiError {
  constructor(message = 'A página foi alterada por outra pessoa.') {
    super(409, message);
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    for (const k of ['mensagem', 'message', 'detail', 'title']) {
      if (typeof b[k] === 'string') return b[k] as string;
    }
  }
  return fallback;
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Ela está rodando?');
  }

  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const fallback: Record<number, string> = {
      401: 'Você precisa entrar para fazer isso.',
      403: 'Você não tem permissão para fazer isso.',
      404: 'Não encontrado.',
    };
    const msg = extractMessage(body, fallback[res.status] ?? `Erro ${res.status} na API.`);
    if (res.status === 409) throw new ConflictError(msg);
    throw new ApiError(res.status, msg);
  }
  return body as T;
}
