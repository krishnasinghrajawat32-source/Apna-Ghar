const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public details?: any;

  constructor(message: string, statusCode: number, errorCode?: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

let currentAccessToken: string | null = null;

export const setStoredAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('apnaghar_token', token);
    } else {
      localStorage.removeItem('apnaghar_token');
    }
  }
};

export const getStoredAccessToken = (): string | null => {
  if (currentAccessToken) return currentAccessToken;
  if (typeof window !== 'undefined') {
    currentAccessToken = localStorage.getItem('apnaghar_token');
  }
  return currentAccessToken;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HTTP-only cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiClientError(
      err?.message || 'Network connection error. Is the backend server running?',
      0,
      'NETWORK_ERROR',
    );
  }

  // If 401 Unauthorized and not already refreshing, attempt refresh once
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/register') &&
    !endpoint.includes('/auth/refresh')
  ) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => request<T>(endpoint, options, true));
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData?.data?.accessToken || refreshData?.accessToken;
        if (newToken) {
          setStoredAccessToken(newToken);
        }
        processQueue(null);
        return request<T>(endpoint, options, true);
      } else {
        setStoredAccessToken(null);
        processQueue(new Error('Session expired'));
      }
    } catch (refreshErr) {
      processQueue(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }

  // Parse response
  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      response.statusText ||
      'An unexpected error occurred';

    throw new ApiClientError(
      errorMsg,
      response.status,
      data?.error || data?.statusCode?.toString(),
      data,
    );
  }

  // NestJS ApiResponse unwrapping if enveloped
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
