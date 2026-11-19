import { mockApi } from './mock';
import { realApi } from './real';
import type { Api } from './types';

export const API_MODE = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock';
export const api: Api = API_MODE === 'real' ? realApi : mockApi;

export * from './types';
export { ApiError, ConflictError } from './http';
