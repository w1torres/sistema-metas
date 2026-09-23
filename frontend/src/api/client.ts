const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Lido diretamente do localStorage (não do authStore) pra evitar import
// circular: authStore usa apiClient pra logar, e o client precisa do token
// que o próprio authStore guarda.
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('metas-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  // 204 No Content (ex.: DELETE) não tem corpo — é sucesso, não erro.
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new ApiClientError(res.status, body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }
  return body.data as T;
}

// Upload multipart (ex.: anexo de indicador, import de planilha) — sem
// Content-Type manual: o navegador seta `multipart/form-data; boundary=...`
// sozinho ao ver um body FormData, e sobrescrever isso quebra o parse no
// servidor (multer não reconhece o boundary).
async function requestForm<T>(path: string, method: string, form: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, { method, headers, body: form });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new ApiClientError(res.status, body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }
  return body.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, 'POST', form),

  // Baixa um arquivo autenticado (Bearer no header — não dá pra usar um
  // <a href> puro) e dispara o "Salvar como" do navegador via um link
  // temporário apontando pro blob baixado.
  downloadFile: async (path: string, nomeArquivo: string): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api${path}`, { headers });
    if (!res.ok) throw new ApiClientError(res.status, `Erro ${res.status} ao baixar ${nomeArquivo}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
