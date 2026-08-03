-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('SCHOOL_GROUP', 'SCHOOL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'GROUP_ADMIN', 'BRANCH_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "ClassMemberRole" AS ENUM ('TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('TEXT', 'IMAGE', 'PDF', 'WORD', 'POWERPOINT', 'EXCEL', 'VIDEO', 'AUDIO', 'ZIP', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VIEWED', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('SUBMISSION_ON_TIME', 'HIGH_GRADE', 'MANUAL_AWARD', 'REWARD_CARD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_ASSIGNMENT', 'DEADLINE_REMINDER', 'FEEDBACK', 'GRADE_PUBLISHED', 'ANNOUNCEMENT', 'PRIVATE_MESSAGE', 'REWARD', 'SYSTEM');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "languageCode" TEXT,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassMember" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClassMemberRole" NOT NULL DEFAULT 'STUDENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassInvite" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssignmentType" NOT NULL DEFAULT 'TEXT',
    "dueAt" TIMESTAMP(3),
    "maxGrade" DOUBLE PRECISION,
    "phetSlug" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "textContent" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionHistory" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "textContent" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "graderId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileObject" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "assignmentId" TEXT,
    "submissionId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "classId" TEXT,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointEntry" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "studentId" TEXT NOT NULL,
    "awardedById" TEXT NOT NULL,
    "reason" "PointReason" NOT NULL,
    "value" INTEGER NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCard" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "pointValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Branch_organizationId_idx" ON "Branch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "ParentLink_studentId_idx" ON "ParentLink"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentLink_parentId_studentId_key" ON "ParentLink"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE INDEX "Class_ownerId_idx" ON "Class"("ownerId");

-- CreateIndex
CREATE INDEX "Class_branchId_idx" ON "Class"("branchId");

-- CreateIndex
CREATE INDEX "Class_archived_deletedAt_idx" ON "Class"("archived", "deletedAt");

-- CreateIndex
CREATE INDEX "ClassMember_userId_idx" ON "ClassMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMember_classId_userId_key" ON "ClassMember"("classId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassInvite_token_key" ON "ClassInvite"("token");

-- CreateIndex
CREATE INDEX "ClassInvite_classId_idx" ON "ClassInvite"("classId");

-- CreateIndex
CREATE INDEX "Assignment_classId_published_idx" ON "Assignment"("classId", "published");

-- CreateIndex
CREATE INDEX "Assignment_dueAt_idx" ON "Assignment"("dueAt");

-- CreateIndex
CREATE INDEX "Assignment_deletedAt_idx" ON "Assignment"("deletedAt");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "SubmissionHistory_submissionId_idx" ON "SubmissionHistory"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_submissionId_key" ON "Grade"("submissionId");

-- CreateIndex
CREATE INDEX "FileObject_assignmentId_idx" ON "FileObject"("assignmentId");

-- CreateIndex
CREATE INDEX "FileObject_submissionId_idx" ON "FileObject"("submissionId");

-- CreateIndex
CREATE INDEX "Announcement_classId_idx" ON "Announcement"("classId");

-- CreateIndex
CREATE INDEX "Message_receiverId_read_idx" ON "Message"("receiverId", "read");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "PointEntry_studentId_idx" ON "PointEntry"("studentId");

-- CreateIndex
CREATE INDEX "PointEntry_branchId_idx" ON "PointEntry"("branchId");

-- CreateIndex
CREATE INDEX "RewardCard_studentId_idx" ON "RewardCard"("studentId");

-- CreateIndex
CREATE INDEX "RewardCard_teacherId_idx" ON "RewardCard"("teacherId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInvite" ADD CONSTRAINT "ClassInvite_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionHistory" ADD CONSTRAINT "SubmissionHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_graderId_fkey" FOREIGN KEY ("graderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardCard" ADD CONSTRAINT "RewardCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardCard" ADD CONSTRAINT "RewardCard_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
