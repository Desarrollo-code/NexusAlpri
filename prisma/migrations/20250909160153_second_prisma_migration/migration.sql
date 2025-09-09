/*
  Warnings:

  - The `priority` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `attachments` column on the `CalendarEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `lastActivity` on the `CourseProgress` table. All the data in the column will be lost.
  - The `options` column on the `FormField` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Lesson` table. All the data in the column will be lost.
  - The `type` column on the `LessonCompletionRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the `FormResponseAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `icon` on table `Achievement` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `audienceType` on the `CalendarEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `description` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `LessonTemplate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LessonCompletionType" AS ENUM ('view', 'quiz', 'video');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('Normal', 'Urgente');

-- CreateEnum
CREATE TYPE "EventAudienceType" AS ENUM ('ALL', 'STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR', 'SPECIFIC');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('SYSTEM', 'USER');

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_questionId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerAttempt" DROP CONSTRAINT "AnswerAttempt_selectedOptionId_fkey";

-- DropForeignKey
ALTER TABLE "FormResponseAnswer" DROP CONSTRAINT "FormResponseAnswer_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "FormResponseAnswer" DROP CONSTRAINT "FormResponseAnswer_responseId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "_SharedResources" DROP CONSTRAINT "_SharedResources_A_fkey";

-- DropIndex
DROP INDEX "AnswerAttempt_questionId_idx";

-- DropIndex
DROP INDEX "CourseProgress_userId_courseId_key";

-- DropIndex
DROP INDEX "Form_creatorId_idx";

-- DropIndex
DROP INDEX "FormField_formId_idx";

-- DropIndex
DROP INDEX "FormResponse_formId_idx";

-- DropIndex
DROP INDEX "FormResponse_userId_idx";

-- DropIndex
DROP INDEX "LessonCompletionRecord_progressId_idx";

-- DropIndex
DROP INDEX "LessonTemplate_creatorId_idx";

-- DropIndex
DROP INDEX "SecurityLog_createdAt_idx";

-- DropIndex
DROP INDEX "TemplateBlock_templateId_idx";

-- DropIndex
DROP INDEX "UserAchievement_userId_idx";

-- DropIndex
DROP INDEX "UserNote_userId_idx";

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "icon" SET NOT NULL;

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "priority",
ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'Normal',
ALTER COLUMN "audience" DROP DEFAULT,
ALTER COLUMN "audience" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "attachments",
ADD COLUMN     "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[],
ALTER COLUMN "color" DROP DEFAULT,
DROP COLUMN "audienceType",
ADD COLUMN     "audienceType" "EventAudienceType" NOT NULL;

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "CourseProgress" DROP COLUMN "lastActivity";

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "options",
ADD COLUMN     "options" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "LessonCompletionRecord" DROP COLUMN "type",
ADD COLUMN     "type" "LessonCompletionType" NOT NULL DEFAULT 'view';

-- AlterTable
ALTER TABLE "LessonTemplate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "TemplateType" NOT NULL;

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "passwordRequireSpecialChar" SET DEFAULT true,
ALTER COLUMN "resourceCategories" SET DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "xp" DROP NOT NULL;

-- DropTable
DROP TABLE "FormResponseAnswer";

-- DropTable
DROP TABLE "Resource";

-- CreateTable
CREATE TABLE "EnterpriseResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "url" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,
    "pin" TEXT,
    "parentId" TEXT,
    "uploaderId" TEXT,

    CONSTRAINT "EnterpriseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "FormAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnterpriseResource_parentId_idx" ON "EnterpriseResource"("parentId");

-- CreateIndex
CREATE INDEX "EnterpriseResource_uploaderId_idx" ON "EnterpriseResource"("uploaderId");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Quiz_contentBlockId_idx" ON "Quiz"("contentBlockId");

-- CreateIndex
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "AnswerOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseResource" ADD CONSTRAINT "EnterpriseResource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EnterpriseResource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnterpriseResource" ADD CONSTRAINT "EnterpriseResource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormAnswer" ADD CONSTRAINT "FormAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "FormResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormAnswer" ADD CONSTRAINT "FormAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedResources" ADD CONSTRAINT "_SharedResources_A_fkey" FOREIGN KEY ("A") REFERENCES "EnterpriseResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
