/*
  Warnings:

  - The values [TEXT_INPUT,TEXT_AREA,NUMBER_INPUT,EMAIL_INPUT,DATE_INPUT,RADIO_GROUP,CHECKBOX_GROUP,SELECT] on the enum `FormFieldType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLOSED] on the enum `FormStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `priority` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `attemptId` on the `AnswerAttempt` table. All the data in the column will be lost.
  - The `attachments` column on the `CalendarEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `templateId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Notification` table. All the data in the column will be lost.
  - The primary key for the `UserAchievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SharedResourceUsers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseProgress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,quizId,attemptNumber]` on the table `QuizAttempt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,achievementId]` on the table `UserAchievement` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `Achievement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizAttemptId` to the `AnswerAttempt` table without a default value. This is not possible if the table is not empty.
  - Made the column `points` on table `AnswerOption` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `audienceType` on the `CalendarEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `ContentBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LessonTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('VIEW', 'EDIT', 'COMMENT');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('Normal', 'Urgente');

-- AlterEnum
BEGIN;
CREATE TYPE "FormFieldType_new" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE');
ALTER TABLE "FormField" ALTER COLUMN "type" TYPE "FormFieldType_new" USING ("type"::text::"FormFieldType_new");
ALTER TYPE "FormFieldType" RENAME TO "FormFieldType_old";
ALTER TYPE "FormFieldType_new" RENAME TO "FormFieldType";
DROP TYPE "FormFieldType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FormStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "Form" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Form" ALTER COLUMN "status" TYPE "FormStatus_new" USING ("status"::text::"FormStatus_new");
ALTER TYPE "FormStatus" RENAME TO "FormStatus_old";
ALTER TYPE "FormStatus_new" RENAME TO "FormStatus";
DROP TYPE "FormStatus_old";
ALTER TABLE "Form" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "FormResponse" DROP CONSTRAINT "FormResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_templateId_fkey";

-- DropForeignKey
ALTER TABLE "LessonTemplate" DROP CONSTRAINT "LessonTemplate_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityLog" DROP CONSTRAINT "SecurityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserNote" DROP CONSTRAINT "UserNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "_EventAttendees" DROP CONSTRAINT "_EventAttendees_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedForms" DROP CONSTRAINT "_SharedForms_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResourceUsers" DROP CONSTRAINT "_SharedResourceUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResourceUsers" DROP CONSTRAINT "_SharedResourceUsers_B_fkey";

-- DropIndex
DROP INDEX "Lesson_templateId_key";

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "authorId" DROP NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "AnswerAttempt" DROP COLUMN "attemptId",
ADD COLUMN     "quizAttemptId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AnswerOption" ALTER COLUMN "points" SET NOT NULL,
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "allDay" SET DEFAULT false,
DROP COLUMN "audienceType",
ADD COLUMN     "audienceType" TEXT NOT NULL,
DROP COLUMN "attachments",
ADD COLUMN     "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "instructorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "templateId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LessonCompletionRecord" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LessonTemplate" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "description",
DROP COLUMN "link",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "id" SET DEFAULT 'cl-nexus-settings-default',
ALTER COLUMN "platformName" SET DEFAULT 'NexusAlpri',
ALTER COLUMN "passwordRequireSpecialChar" SET DEFAULT true,
ALTER COLUMN "resourceCategories" SET DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE';

-- AlterTable
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Resource";

-- DropTable
DROP TABLE "_SharedResourceUsers";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "EventAudienceType";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "registeredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "theme" TEXT,
    "xp" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "category" TEXT,
    "tags" TEXT,
    "url" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "hasPin" BOOLEAN NOT NULL DEFAULT false,
    "pin" TEXT,
    "parentId" TEXT,
    "uploaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourcePermission" (
    "id" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ResourcePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReceipt" (
    "id" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SharedResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EnterpriseResource_parentId_idx" ON "EnterpriseResource"("parentId");

-- CreateIndex
CREATE INDEX "EnterpriseResource_uploaderId_idx" ON "EnterpriseResource"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePermission_resourceId_userId_type_key" ON "ResourcePermission"("resourceId", "userId", "type");

-- CreateIndex
CREATE INDEX "AnnouncementAttachment_announcementId_idx" ON "AnnouncementAttachment"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReaction_announcementId_userId_emoji_key" ON "AnnouncementReaction"("announcementId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReceipt_announcementId_userId_key" ON "AnnouncementReceipt"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_SharedResources_AB_unique" ON "_SharedResources"("A", "B");

-- CreateIndex
CREATE INDEX "_SharedResources_B_index" ON "_SharedResources"("B");

-- CreateIndex
CREATE INDEX "CalendarEvent_creatorId_idx" ON "CalendarEvent"("creatorId");

-- CreateIndex
CREATE INDEX "ContentBlock_lessonId_idx" ON "ContentBlock"("lessonId");

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Form_creatorId_idx" ON "Form"("creatorId");

-- CreateIndex
CREATE INDEX "FormAnswer_responseId_idx" ON "FormAnswer"("responseId");

-- CreateIndex
CREATE INDEX "FormField_formId_idx" ON "FormField"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_formId_idx" ON "FormResponse"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_userId_idx" ON "FormResponse"("userId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_userId_quizId_attemptNumber_key" ON "QuizAttempt"("userId", "quizId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseResource" ADD CONSTRAINT "EnterpriseResource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseResource" ADD CONSTRAINT "EnterpriseResource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EnterpriseResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "EnterpriseResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAttachment" ADD CONSTRAINT "AnnouncementAttachment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonTemplate" ADD CONSTRAINT "LessonTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResources" ADD CONSTRAINT "_SharedResources_A_fkey" FOREIGN KEY ("A") REFERENCES "EnterpriseResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResources" ADD CONSTRAINT "_SharedResources_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAttendees" ADD CONSTRAINT "_EventAttendees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedForms" ADD CONSTRAINT "_SharedForms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
