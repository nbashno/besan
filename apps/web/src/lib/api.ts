'use client';

import { getInitData } from './telegram';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

let accessToken: string | null = null;

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'ERROR',
      json.error?.message ?? 'حدث خطأ',
    );
  }
  return json.data as T;
}

export interface AuthResult {
  accessToken: string;
  userId: string;
  role: string;
  firstName: string;
  profileComplete: boolean;
  displayName?: string | null;
  schoolName?: string | null;
}

export async function completeProfile(input: {
  displayName: string;
  role: "TEACHER" | "STUDENT";
  schoolName?: string;
}): Promise<AuthResult> {
  const result = await request<AuthResult>("/auth/complete-profile", {
    method: "POST",
    body: input,
  });
  accessToken = result.accessToken;
  return result;
}

/** تسجيل الدخول عبر Telegram — يُخزّن الرمز في الذاكرة */
export async function login(): Promise<AuthResult> {
  const initData = getInitData();
  const result = await request<AuthResult>('/auth/telegram', {
    method: 'POST',
    body: { initData },
  });
  accessToken = result.accessToken;
  return result;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body }),
  patch: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PATCH', body }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};

/**
 * رفع ملف مباشرة إلى التخزين عبر الرابط الموقّع.
 * الخادم لا يمرّر بايتات الملف — سرعة قصوى وحد أدنى للتخزين الوسيط.
 */
export async function uploadViaSignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new ApiError('UPLOAD_FAILED', 'فشل رفع الملف');
}
