import { ApiErrorResponse } from '@apna-ghar/shared-types';

// Ensure URL does not have trailing slashes and ends with /api/v1
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    return 'http://localhost:4000/api/v1';
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

const API_BASE_URL = getBaseUrl();

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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

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

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HTTP-Only auth cookies for same-site or cross-site environments
  });

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
