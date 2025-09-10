/*
  Warnings:

  - You are about to drop the column `originalLessonId` on the `LessonTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `_FormSharedWith` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SharedResources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lesson_completion_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_notes` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `LessonTemplate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `uploaderId` on table `Resource` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('SYSTEM', 'USER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FormFieldType" ADD VALUE 'TEXT_INPUT';
ALTER TYPE "FormFieldType" ADD VALUE 'TEXT_AREA';
ALTER TYPE "FormFieldType" ADD VALUE 'NUMBER_INPUT';
ALTER TYPE "FormFieldType" ADD VALUE 'EMAIL_INPUT';
ALTER TYPE "FormFieldType" ADD VALUE 'DATE_INPUT';
ALTER TYPE "FormFieldType" ADD VALUE 'RADIO_GROUP';
ALTER TYPE "FormFieldType" ADD VALUE 'CHECKBOX_GROUP';
ALTER TYPE "FormFieldType" ADD VALUE 'SELECT';

-- AlterEnum
ALTER TYPE "FormStatus" ADD VALUE 'CLOSED';

-- DropForeignKey
ALTER TABLE "LessonTemplate" DROP CONSTRAINT "LessonTemplate_originalLessonId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "_EventAttendees" DROP CONSTRAINT "_EventAttendees_A_fkey";

-- DropForeignKey
ALTER TABLE "_FormSharedWith" DROP CONSTRAINT "_FormSharedWith_A_fkey";

-- DropForeignKey
ALTER TABLE "_FormSharedWith" DROP CONSTRAINT "_FormSharedWith_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_B_fkey";

-- DropForeignKey
ALTER TABLE "answer_attempts" DROP CONSTRAINT "answer_attempts_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "answer_attempts" DROP CONSTRAINT "answer_attempts_questionId_fkey";

-- DropForeignKey
ALTER TABLE "answer_attempts" DROP CONSTRAINT "answer_attempts_selectedOptionId_fkey";

-- DropForeignKey
ALTER TABLE "answer_options" DROP CONSTRAINT "answer_options_questionId_fkey";

-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "content_blocks" DROP CONSTRAINT "content_blocks_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "course_progress" DROP CONSTRAINT "course_progress_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_progress" DROP CONSTRAINT "course_progress_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "course_progress" DROP CONSTRAINT "course_progress_userId_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_completion_records" DROP CONSTRAINT "lesson_completion_records_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_completion_records" DROP CONSTRAINT "lesson_completion_records_progressId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_userId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_contentBlockId_fkey";

-- DropForeignKey
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_notes" DROP CONSTRAINT "user_notes_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "user_notes" DROP CONSTRAINT "user_notes_userId_fkey";

-- AlterTable
ALTER TABLE "LessonTemplate" DROP COLUMN "originalLessonId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "TemplateType" NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "description" DROP NOT NULL;

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
ALTER COLUMN "resourceCategories" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Resource" ALTER COLUMN "uploaderId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SecurityLog" ALTER COLUMN "event" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLogin",
ALTER COLUMN "xp" DROP NOT NULL;

-- DropTable
DROP TABLE "_FormSharedWith";

-- DropTable
DROP TABLE "_SharedResources";

-- DropTable
DROP TABLE "achievements";

-- DropTable
DROP TABLE "answer_attempts";

-- DropTable
DROP TABLE "answer_options";

-- DropTable
DROP TABLE "calendar_events";

-- DropTable
DROP TABLE "content_blocks";

-- DropTable
DROP TABLE "course_progress";

-- DropTable
DROP TABLE "courses";

-- DropTable
DROP TABLE "enrollments";

-- DropTable
DROP TABLE "lesson_completion_records";

-- DropTable
DROP TABLE "lessons";

-- DropTable
DROP TABLE "modules";

-- DropTable
DROP TABLE "questions";

-- DropTable
DROP TABLE "quiz_attempts";

-- DropTable
DROP TABLE "quizzes";

-- DropTable
DROP TABLE "user_achievements";

-- DropTable
DROP TABLE "user_notes";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "instructorId" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "moduleId" TEXT NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "type" "LessonType" NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentBlockId" TEXT NOT NULL,
    "maxAttempts" INTEGER,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "feedback" TEXT,
    "points" INTEGER DEFAULT 10,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonCompletionRecord" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'view',
    "score" DOUBLE PRECISION,

    CONSTRAINT "LessonCompletionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerAttempt" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,

    CONSTRAINT "AnswerAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL,
    "location" TEXT,
    "audienceType" "EventAudienceType" NOT NULL DEFAULT 'ALL',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "creatorId" TEXT NOT NULL,
    "videoConferenceLink" TEXT,
    "attachments" JSONB,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" "AchievementSlug" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "points" INTEGER NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "_SharedResourceUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SharedForms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_templateId_key" ON "Lesson"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_contentBlockId_key" ON "Quiz"("contentBlockId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_enrollmentId_key" ON "CourseProgress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonCompletionRecord_progressId_lessonId_key" ON "LessonCompletionRecord"("progressId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNote_userId_lessonId_key" ON "UserNote"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_SharedResourceUsers_AB_unique" ON "_SharedResourceUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_SharedResourceUsers_B_index" ON "_SharedResourceUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SharedForms_AB_unique" ON "_SharedForms"("A", "B");

-- CreateIndex
CREATE INDEX "_SharedForms_B_index" ON "_SharedForms"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LessonTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_contentBlockId_fkey" FOREIGN KEY ("contentBlockId") REFERENCES "ContentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerOption" ADD CONSTRAINT "AnswerOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletionRecord" ADD CONSTRAINT "LessonCompletionRecord_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "CourseProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletionRecord" ADD CONSTRAINT "LessonCompletionRecord_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "AnswerOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResourceUsers" ADD CONSTRAINT "_SharedResourceUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResourceUsers" ADD CONSTRAINT "_SharedResourceUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAttendees" ADD CONSTRAINT "_EventAttendees_A_fkey" FOREIGN KEY ("A") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedForms" ADD CONSTRAINT "_SharedForms_A_fkey" FOREIGN KEY ("A") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedForms" ADD CONSTRAINT "_SharedForms_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
