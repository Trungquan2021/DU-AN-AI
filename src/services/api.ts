import { auth } from '../lib/firebase';

let memoryAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  memoryAuthToken = token;
}

export function getAuthToken(): string | null {
  return memoryAuthToken;
}

async function resolveBearerToken(): Promise<string | null> {
  if (memoryAuthToken && memoryAuthToken.startsWith('local.')) {
    return memoryAuthToken;
  }
  if (auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken();
      memoryAuthToken = freshToken;
      return freshToken;
    } catch {
      return memoryAuthToken;
    }
  }
  return memoryAuthToken;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await resolveBearerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
  }
  return data as T;
}
