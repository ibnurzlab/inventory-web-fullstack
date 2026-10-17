import type {
  CategoryStat,
  ImportResult,
  Item,
  ItemPayload,
  ReportSummary,
  TopItem,
  Transaction,
  TransactionFilters,
  TransactionPayload,
  TrendPoint,
  User,
} from '../types/inventory';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const TOKEN_KEY = 'gudangflow_token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage tidak tersedia */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage tidak tersedia */
  }
}

function buildQuery(params?: object): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) return data.message;
  } catch {
    /* respons bukan JSON */
  }
  return `Permintaan gagal (HTTP ${response.status}).`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeaders(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.blob()) as unknown as T;
}

async function fetchBlob(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response.blob();
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.replace(/^data:[^;]+;base64,/, ''));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file yang dipilih.'));
    reader.readAsDataURL(file);
  });
}

export const api = {
  // --- Autentikasi ---------------------------------------------------------
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ user: User }>('/auth/me'),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Pengguna (khusus ADMIN) --------------------------------------------
  listUsers: () => request<{ users: User[] }>('/auth/users'),

  createUser: (payload: { username: string; name: string; password: string; role: 'ADMIN' | 'STAFF' }) =>
    request<{ user: User }>('/auth/users', { method: 'POST', body: JSON.stringify(payload) }),

  updateUser: (id: string, payload: { name?: string; password?: string; role?: 'ADMIN' | 'STAFF'; active?: boolean }) =>
    request<{ user: User }>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteUser: (id: string) => request<{ message: string }>(`/auth/users/${id}`, { method: 'DELETE' }),

  // --- Barang --------------------------------------------------------------
  listItems: (params?: { q?: string; category?: string }) =>
    request<{ items: Item[] }>(`/items${buildQuery(params)}`),

  createItem: (payload: ItemPayload) =>
    request<{ item: Item }>('/items', { method: 'POST', body: JSON.stringify(payload) }),

  updateItem: (id: string, payload: ItemPayload) =>
    request<{ item: Item }>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteItem: (id: string) => request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),

  importItems: async (file: File) => {
    const dataBase64 = await readFileAsBase64(file);
    return request<ImportResult>('/items/import', {
      method: 'POST',
      body: JSON.stringify({ dataBase64 }),
    });
  },

  exportItems: async () => {
    triggerDownload(await fetchBlob('/items/export'), `data-barang-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  downloadItemTemplate: async () => {
    triggerDownload(await fetchBlob('/items/template'), 'template-import-barang.xlsx');
  },

  // --- Transaksi -----------------------------------------------------------
  listTransactions: (params?: TransactionFilters & { limit?: number }) =>
    request<{ transactions: Transaction[]; total: number }>(`/transactions${buildQuery(params)}`),

  createTransaction: (payload: TransactionPayload) =>
    request<{ transaction: Transaction; item: Item }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  exportTransactions: async (filters: TransactionFilters) => {
    triggerDownload(
      await fetchBlob(`/transactions/export${buildQuery(filters)}`),
      `riwayat-transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },

  printTransactionReport: async (filters: TransactionFilters) => {
    const blob = await fetchBlob(`/transactions/report.pdf${buildQuery(filters)}`);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  },

  printNota: async (transactionId: string) => {
    const blob = await fetchBlob(`/transactions/${transactionId}/nota.pdf`);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  },

  // --- Laporan -------------------------------------------------------------
  reportSummary: () => request<ReportSummary>('/reports/summary'),

  reportTrend: (days: number) => request<{ trend: TrendPoint[] }>(`/reports/trend?days=${days}`),

  reportTopItems: (limit: number, direction: 'IN' | 'OUT') =>
    request<{ direction: 'IN' | 'OUT'; items: TopItem[] }>(`/reports/top-items?limit=${limit}&direction=${direction}`),

  reportCategories: () => request<{ categories: CategoryStat[] }>('/reports/categories'),
};
