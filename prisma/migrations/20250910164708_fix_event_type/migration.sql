/*
  Warnings:

  - The `priority` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `options` column on the `FormField` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `LessonCompletionRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `LessonTemplate` table. All the data in the column will be lost.
  - The `type` column on the `LessonTemplate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `templateId` on the `TemplateBlock` table. All the data in the column will be lost.
  - The primary key for the `UserAchievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserAchievement` table. All the data in the column will be lost.
  - You are about to drop the `EnterpriseResource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendedEvents` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseProgress` will be added. If there are existing duplicate values, this will fail.
  - Made the column `color` on table `CalendarEvent` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `event` on the `SecurityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `lessonTemplateId` to the `TemplateBlock` table without a default value. This is not possible if the table is not empty.
  - Made the column `xp` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_COURSE', 'ANNOUNCEMENT', 'COURSE_COMPLETED', 'ACHIEVEMENT_UNLOCKED', 'MENTION', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "EnterpriseResource" DROP CONSTRAINT "EnterpriseResource_parentId_fkey";

-- DropForeignKey
ALTER TABLE "EnterpriseResource" DROP CONSTRAINT "EnterpriseResource_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateBlock" DROP CONSTRAINT "TemplateBlock_templateId_fkey";

-- DropForeignKey
ALTER TABLE "_AttendedEvents" DROP CONSTRAINT "_AttendedEvents_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttendedEvents" DROP CONSTRAINT "_AttendedEvents_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_A_fkey";

-- DropIndex
DROP INDEX "Announcement_authorId_idx";

-- DropIndex
DROP INDEX "AnswerOption_questionId_idx";

-- DropIndex
DROP INDEX "CalendarEvent_creatorId_idx";

-- DropIndex
DROP INDEX "Course_status_idx";

-- DropIndex
DROP INDEX "CourseProgress_courseId_idx";

-- DropIndex
DROP INDEX "CourseProgress_userId_idx";

-- DropIndex
DROP INDEX "Enrollment_courseId_idx";

-- DropIndex
DROP INDEX "Enrollment_userId_idx";

-- DropIndex
DROP INDEX "Lesson_moduleId_idx";

-- DropIndex
DROP INDEX "LessonCompletionRecord_lessonId_idx";

-- DropIndex
DROP INDEX "Question_quizId_idx";

-- DropIndex
DROP INDEX "Quiz_contentBlockId_idx";

-- DropIndex
DROP INDEX "QuizAttempt_quizId_idx";

-- DropIndex
DROP INDEX "QuizAttempt_userId_idx";

-- DropIndex
DROP INDEX "SecurityLog_event_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "UserAchievement_userId_achievementId_key";

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "authorId" DROP NOT NULL,
ALTER COLUMN "audience" SET DEFAULT 'ALL',
DROP COLUMN "priority",
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "audienceType" SET DEFAULT 'ALL',
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT 'blue';

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "instructorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "options",
ADD COLUMN     "options" JSONB;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "LessonCompletionRecord" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'view';

-- AlterTable
ALTER TABLE "LessonTemplate" DROP COLUMN "createdAt",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "platformName" DROP DEFAULT,
ALTER COLUMN "primaryColor" DROP NOT NULL,
ALTER COLUMN "primaryColor" DROP DEFAULT,
ALTER COLUMN "secondaryColor" DROP NOT NULL,
ALTER COLUMN "secondaryColor" DROP DEFAULT,
ALTER COLUMN "accentColor" DROP NOT NULL,
ALTER COLUMN "accentColor" DROP DEFAULT,
ALTER COLUMN "backgroundColorLight" DROP NOT NULL,
ALTER COLUMN "backgroundColorLight" DROP DEFAULT,
ALTER COLUMN "primaryColorDark" DROP NOT NULL,
ALTER COLUMN "primaryColorDark" DROP DEFAULT,
ALTER COLUMN "backgroundColorDark" DROP NOT NULL,
ALTER COLUMN "backgroundColorDark" DROP DEFAULT,
ALTER COLUMN "fontHeadline" DROP NOT NULL,
ALTER COLUMN "fontHeadline" DROP DEFAULT,
ALTER COLUMN "fontBody" DROP NOT NULL,
ALTER COLUMN "fontBody" DROP DEFAULT,
ALTER COLUMN "passwordRequireSpecialChar" SET DEFAULT false,
ALTER COLUMN "resourceCategories" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SecurityLog" DROP COLUMN "event",
ADD COLUMN     "event" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TemplateBlock" DROP COLUMN "templateId",
ADD COLUMN     "lessonTemplateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "xp" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId", "achievementId");

-- DropTable
DROP TABLE "EnterpriseResource";

-- DropTable
DROP TABLE "_AttendedEvents";

-- DropEnum
DROP TYPE "AnnouncementAudience";

-- DropEnum
DROP TYPE "AnnouncementPriority";

-- DropEnum
DROP TYPE "LessonCompletionType";

-- DropEnum
DROP TYPE "SecurityLogEvent";

-- DropEnum
DROP TYPE "TemplateType";

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT,
    "hasPin" BOOLEAN NOT NULL DEFAULT false,
    "pin" TEXT,
    "parent_id" TEXT,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventAttendees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Resource_parent_id_idx" ON "Resource"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "_EventAttendees_AB_unique" ON "_EventAttendees"("A", "B");

-- CreateIndex
CREATE INDEX "_EventAttendees_B_index" ON "_EventAttendees"("B");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Form_creatorId_idx" ON "Form"("creatorId");

-- CreateIndex
CREATE INDEX "FormAnswer_responseId_idx" ON "FormAnswer"("responseId");

-- CreateIndex
CREATE INDEX "FormAnswer_fieldId_idx" ON "FormAnswer"("fieldId");

-- CreateIndex
CREATE INDEX "FormField_formId_idx" ON "FormField"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_formId_idx" ON "FormResponse"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_userId_idx" ON "FormResponse"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_idx" ON "QuizAttempt"("userId", "quizId");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LessonTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateBlock" ADD CONSTRAINT "TemplateBlock_lessonTemplateId_fkey" FOREIGN KEY ("lessonTemplateId") REFERENCES "LessonTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResources" ADD CONSTRAINT "_SharedResources_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAttendees" ADD CONSTRAINT "_EventAttendees_A_fkey" FOREIGN KEY ("A") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAttendees" ADD CONSTRAINT "_EventAttendees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
