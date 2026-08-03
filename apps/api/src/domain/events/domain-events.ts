// أحداث النطاق — العمود الفقري للتصميم المدفوع بالأحداث
// كل حدث يحمل ما يكفي لمستمعيه دون الرجوع لقاعدة البيانات

export const DomainEvent = {
  UserRegistered: 'user.registered',
  ClassCreated: 'class.created',
  StudentJoinedClass: 'class.student_joined',
  AssignmentCreated: 'assignment.created',
  SubmissionCreated: 'submission.created',
  SubmissionReplaced: 'submission.replaced',
  SubmissionGraded: 'submission.graded',
  RewardGranted: 'reward.granted',
  PointsAwarded: 'reward.points_awarded',
  MessageSent: 'message.sent',
  AnnouncementPosted: 'announcement.posted',
} as const;

export type DomainEventName = (typeof DomainEvent)[keyof typeof DomainEvent];

export interface UserRegisteredPayload {
  userId: string;
  telegramId: bigint;
  role: string;
}
export interface AssignmentCreatedPayload {
  assignmentId: string;
  classId: string;
  title: string;
  dueAt: string | null;
}
export interface SubmissionCreatedPayload {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  teacherId: string;
  isLate: boolean;
}
export interface SubmissionGradedPayload {
  submissionId: string;
  studentId: string;
  value: number;
  maxGrade: number | null;
}
export interface RewardGrantedPayload {
  studentId: string;
  teacherId: string;
  title: string;
  pointValue: number;
}
