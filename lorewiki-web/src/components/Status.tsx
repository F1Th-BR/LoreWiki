import type { ReactNode } from 'react';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="status" role="status">
      <span className="spinner" aria-hidden /> {label}
    </div>
  );
}

export function ErrorBox({ error, children }: { error: Error; children?: ReactNode }) {
  return (
    <div className="notice notice-error" role="alert">
      <strong>Ops.</strong> {error.message}
      {children}
    </div>
  );
}
