import { ApiErrorResponse } from '@apna-ghar/shared-types';

const PROD_API_FALLBACK = 'https://apna-ghar-2-4766.onrender.com/api/v1';

// Dynamically resolve API URL for localhost, LAN network IP, and production cloud
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const isLocalhost =
      currentHost === 'localhost' ||
      currentHost === '127.0.0.1' ||
      currentHost === '0.0.0.0' ||
      currentHost === '';
    const isLan =
      /^10\.\d+\.\d+\.\d+$/.test(currentHost) ||
      /^192\.168\.\d+\.\d+$/.test(currentHost) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(currentHost) ||
      currentHost.endsWith('.local');

    // On local machine dev
    if (isLocalhost) {
      return 'http://localhost:4000/api/v1';
    }

    // On mobile / LAN network dev
    if (isLan) {
      return `${window.location.protocol}//${currentHost}:4000/api/v1`;
    }

    // When running on public cloud (e.g. Vercel: apna-ghar-mauve.vercel.app):
    // If NEXT_PUBLIC_API_URL is explicitly set to an external URL (not localhost), use it
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      const clean = envUrl.replace(/\/+$/, '');
      return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
    }

    // Otherwise, use same-origin relative '/api/v1', which Next.js rewrites/proxies
    // to the backend server. This completely bypasses browser CORS errors and preflight checks!
    return '/api/v1';
  }

  // Server-side execution
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL;
  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    const isCloud = Boolean(process.env.VERCEL || process.env.RENDER);
    return isCloud
      ? PROD_API_FALLBACK
      : 'http://localhost:4000/api/v1';
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Hybrid Auth Fallback: Check localStorage for access token to ensure cross-origin resilience
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('apna_ghar_access_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include HTTP-Only auth cookies for same-site or cross-site environments
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isConnRefused =
      errMsg.includes('fetch') ||
      errMsg.includes('Failed to fetch') ||
      errMsg.includes('NetworkError') ||
      errMsg.includes('ECONNREFUSED');

    if (isConnRefused) {
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const message = isLocalhost
        ? `Unable to connect to the Apna Ghar API server at ${url}. Please verify that the backend API server is running on port 4000.`
        : `Unable to reach the backend server. If the server was sleeping, please wait a few seconds and try again.`;

      throw new ApiError('NETWORK_ERROR', message);
    }
    throw err;
  }

  // Handle empty 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  // Robust response parsing
  let json: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  } else {
    const text = await response.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  if (!response.ok || (json && json.success === false)) {
    const errorRes = json as ApiErrorResponse;
    const code = errorRes?.error?.code || 'UNKNOWN_ERROR';
    const message =
      errorRes?.error?.message ||
      json?.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(code, message, errorRes?.error?.details, response.status);
  }

  // Preserve paginated structure: if response contains both data and meta, return full structure
  if (json && typeof json === 'object' && 'data' in json && 'meta' in json) {
    return {
      data: json.data,
      meta: json.meta,
    } as unknown as T;
  }

  // Unpack standard envelope { success: true, data: ... }
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return json.data as T;
  }

  // Direct data wrapper unpack
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  // Return raw payload if no wrapper
  return json as T;
}
