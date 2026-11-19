// Os claims do JWT da API usam as URIs longas do ClaimTypes do .NET.
export const CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
export const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

export interface SessionUser {
  id: string;
  email: string;
}

const b64urlDecode = (s: string) =>
  decodeURIComponent(
    Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      '%' + c.charCodeAt(0).toString(16).padStart(2, '0'),
    ).join(''),
  );

export const b64urlEncode = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Lê id/e-mail do token. Retorna null se inválido ou expirado. A assinatura só é validada na API. */
export function userFromToken(token: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(b64urlDecode(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    const id = payload[CLAIM_ID];
    const email = payload[CLAIM_EMAIL];
    return id ? { id, email: email ?? '' } : null;
  } catch {
    return null;
  }
}
