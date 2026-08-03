import { z } from 'zod';

/**
 * مصدر الحقيقة الوحيد للأنواع المشتركة بين الـAPI والواجهة.
 * يعكس تمامًا enums المخطط في Prisma.
 */

// ===== الأدوار =====
export const ROLES = [
  'SUPER_ADMIN',
  'GROUP_ADMIN',
  'BRANCH_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT',
] as const;
export type Role = (typeof ROLES)[number];

// الأدوار المفعّلة فعليًا في MVP
export const MVP_ROLES: Role[] = ['BRANCH_ADMIN', 'TEACHER', 'STUDENT'];

// ===== أنواع المؤسسة =====
export const ORG_TYPES = ['SCHOOL_GROUP', 'SCHOOL'] as const;
export type OrgType = (typeof ORG_TYPES)[number];

// ===== أنواع الواجب =====
export const ASSIGNMENT_TYPES = [
  'TEXT',
  'IMAGE',
  'PDF',
  'WORD',
  'POWERPOINT',
  'EXCEL',
  'VIDEO',
  'AUDIO',
  'ZIP',
  'MULTIPLE',
] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

// ===== حالة التسليم =====
export const SUBMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'VIEWED',
  'GRADED',
  'RETURNED',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

// ===== أسباب النقاط =====
export const POINT_REASONS = [
  'SUBMISSION_ON_TIME',
  'HIGH_GRADE',
  'MANUAL_AWARD',
  'REWARD_CARD',
] as const;
export type PointReason = (typeof POINT_REASONS)[number];

// ===== أنواع الإشعارات =====
export const NOTIFICATION_TYPES = [
  'NEW_ASSIGNMENT',
  'DEADLINE_REMINDER',
  'FEEDBACK',
  'GRADE_PUBLISHED',
  'ANNOUNCEMENT',
  'REWARD_CARD',
  'PRIVATE_MESSAGE',
  'SYSTEM',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ===== شكل الاستجابة الموحّد =====
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ===== الهوية المستخرجة من Telegram بعد التحقق =====
export const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  photo_url: z.string().url().optional(),
});
export type TelegramUser = z.infer<typeof telegramUserSchema>;

// ===== حمولة الـJWT =====
export interface JwtPayload {
  sub: string; // user id
  role: Role;
  branchId: string | null;
  orgId: string | null;
}
