import { ApiResponse, ApiErrorResponse } from '@apna-ghar/shared-types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HTTP-Only auth cookies
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    const errorRes = json as ApiErrorResponse;
    const code = errorRes.error?.code || 'UNKNOWN_ERROR';
    const message = errorRes.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(code, message, errorRes.error?.details);
  }

  const successRes = json as ApiResponse<T>;
  return successRes.data;
}
