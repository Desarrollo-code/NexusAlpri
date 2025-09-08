/*
  Warnings:

  - The values [SHORT_TEXT,LONG_TEXT,SINGLE_CHOICE,MULTIPLE_CHOICE] on the enum `FormFieldType` will be removed. If these variants are still used in the database, this will fail.
  - The `attachments` column on the `CalendarEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `courseId` on the `CourseProgress` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivity` on the `CourseProgress` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `CourseProgress` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `LessonTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `contentBlockId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FormAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventAttendees` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[quizId]` on the table `ContentBlock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Made the column `priority` on table `Announcement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `audienceType` on the `CalendarEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `LessonCompletionRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `registeredDate` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LessonCompletionType" AS ENUM ('view', 'video', 'quiz');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC');

-- AlterEnum
BEGIN;
CREATE TYPE "FormFieldType_new" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'CHECKBOX', 'RADIO', 'SELECT', 'DATE', 'EMAIL');
ALTER TABLE "FormField" ALTER COLUMN "type" TYPE "FormFieldType_new" USING ("type"::text::"FormFieldType_new");
ALTER TYPE "FormFieldType" RENAME TO "FormFieldType_old";
ALTER TYPE "FormFieldType_new" RENAME TO "FormFieldType";
DROP TYPE "FormFieldType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_questionId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_selectedOptionId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerOption" DROP CONSTRAINT "AnswerOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "ContentBlock" DROP CONSTRAINT "ContentBlock_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "FormAnswer" DROP CONSTRAINT "FormAnswer_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "FormAnswer" DROP CONSTRAINT "FormAnswer_responseId_fkey";

-- DropForeignKey
ALTER TABLE "FormField" DROP CONSTRAINT "FormField_formId_fkey";

-- DropForeignKey
ALTER TABLE "FormResponse" DROP CONSTRAINT "FormResponse_formId_fkey";

-- DropForeignKey
ALTER TABLE "FormResponse" DROP CONSTRAINT "FormResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "LessonCompletionRecord" DROP CONSTRAINT "LessonCompletionRecord_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "LessonCompletionRecord" DROP CONSTRAINT "LessonCompletionRecord_progressId_fkey";

-- DropForeignKey
ALTER TABLE "LessonTemplate" DROP CONSTRAINT "LessonTemplate_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "LessonTemplate" DROP CONSTRAINT "LessonTemplate_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_contentBlockId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_quizId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityLog" DROP CONSTRAINT "SecurityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateBlock" DROP CONSTRAINT "TemplateBlock_templateId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserNote" DROP CONSTRAINT "UserNote_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "UserNote" DROP CONSTRAINT "UserNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "_EventAttendees" DROP CONSTRAINT "_EventAttendees_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventAttendees" DROP CONSTRAINT "_EventAttendees_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedForms" DROP CONSTRAINT "_SharedForms_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedForms" DROP CONSTRAINT "_SharedForms_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_B_fkey";

-- DropIndex
DROP INDEX "Quiz_contentBlockId_key";

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "points" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "audience" DROP DEFAULT,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "AnswerOption" ALTER COLUMN "isCorrect" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "audienceType",
ADD COLUMN     "audienceType" "AudienceType" NOT NULL,
DROP COLUMN "attachments",
ADD COLUMN     "attachments" JSONB[];

-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "quizId" TEXT;

-- AlterTable
ALTER TABLE "CourseProgress" DROP COLUMN "courseId",
DROP COLUMN "lastActivity",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LessonCompletionRecord" DROP COLUMN "type",
ADD COLUMN     "type" "LessonCompletionType" NOT NULL;

-- AlterTable
ALTER TABLE "LessonTemplate" DROP COLUMN "lessonId";

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "passwordRequireSpecialChar" SET DEFAULT true,
ALTER COLUMN "primaryColor" DROP DEFAULT,
ALTER COLUMN "secondaryColor" DROP DEFAULT,
ALTER COLUMN "accentColor" DROP DEFAULT,
ALTER COLUMN "backgroundColorLight" DROP DEFAULT,
ALTER COLUMN "primaryColorDark" DROP DEFAULT,
ALTER COLUMN "backgroundColorDark" DROP DEFAULT,
ALTER COLUMN "fontHeadline" DROP DEFAULT,
ALTER COLUMN "fontBody" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "contentBlockId";

-- AlterTable
ALTER TABLE "SecurityLog" ADD COLUMN     "emailAttempt" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "theme",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "registeredDate" SET NOT NULL;

-- DropTable
DROP TABLE "FormAnswer";

-- DropTable
DROP TABLE "Resource";

-- DropTable
DROP TABLE "_EventAttendees";

-- DropEnum
DROP TYPE "EventAudienceType";

-- CreateTable
CREATE TABLE "FormResponseAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "FormResponseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "url" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "hasPin" BOOLEAN NOT NULL DEFAULT false,
    "pin" TEXT,
    "parentId" TEXT,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EnterpriseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttendingEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AttendingEvents_AB_unique" ON "_AttendingEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_AttendingEvents_B_index" ON "_AttendingEvents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_quizId_key" ON "ContentBlock"("quizId");
