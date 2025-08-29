/*
  Warnings:

  - The values [PERFECT_SCORE] on the enum `Achievement_slug` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `quizAttemptId` on the `answerattempt` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `answeroption` table. All the data in the column will be lost.
  - You are about to alter the column `audienceType` on the `calendarevent` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `VarChar(191)`.
  - You are about to drop the column `lastActivity` on the `courseprogress` table. All the data in the column will be lost.
  - The values [RATING] on the enum `FormField_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `type` on the `lessontemplate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(6))`.
  - You are about to drop the column `hasPin` on the `resource` table. All the data in the column will be lost.
  - You are about to drop the column `earnedAt` on the `userachievement` table. All the data in the column will be lost.
  - You are about to drop the `_formtouser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_sharedresources` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attemptId` to the `AnswerAttempt` table without a default value. This is not possible if the table is not empty.
  - Made the column `uploaderId` on table `resource` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `xp` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `LessonTemplate_creatorId_idx` ON `lessontemplate`;

-- AlterTable
ALTER TABLE `achievement` MODIFY `slug` ENUM('FIRST_ENROLLMENT', 'FIRST_COURSE_COMPLETED', 'PERFECT_QUIZ_SCORE', 'FIVE_COURSES_COMPLETED') NOT NULL;

-- AlterTable
ALTER TABLE `answerattempt` DROP COLUMN `quizAttemptId`,
    ADD COLUMN `attemptId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `answeroption` DROP COLUMN `points`;

-- AlterTable
ALTER TABLE `calendarevent` MODIFY `color` VARCHAR(191) NULL,
    MODIFY `audienceType` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `course` MODIFY `instructorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `courseprogress` DROP COLUMN `lastActivity`,
    MODIFY `enrollmentId` VARCHAR(191) NULL,
    MODIFY `progressPercentage` DOUBLE NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `form` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `formfield` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'DATE', 'NUMBER') NOT NULL;

-- AlterTable
ALTER TABLE `lessontemplate` MODIFY `type` ENUM('SYSTEM', 'USER') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `platformsettings` ALTER COLUMN `platformName` DROP DEFAULT,
    MODIFY `emailWhitelist` TEXT NULL,
    MODIFY `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE') NOT NULL DEFAULT 'SINGLE_CHOICE',
    MODIFY `text` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `resource` DROP COLUMN `hasPin`,
    MODIFY `description` VARCHAR(191) NULL,
    ALTER COLUMN `type` DROP DEFAULT,
    MODIFY `uploaderId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastLogin` DATETIME(3) NULL,
    MODIFY `password` VARCHAR(191) NOT NULL,
    MODIFY `xp` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `userachievement` DROP COLUMN `earnedAt`,
    ADD COLUMN `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `_formtouser`;

-- DropTable
DROP TABLE `_sharedresources`;

-- CreateTable
CREATE TABLE `_ResourceSharedWith` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ResourceSharedWith_AB_unique`(`A`, `B`),
    INDEX `_ResourceSharedWith_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FormSharedWith` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FormSharedWith_AB_unique`(`A`, `B`),
    INDEX `_FormSharedWith_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AnswerAttempt_attemptId_idx` ON `AnswerAttempt`(`attemptId`);

-- CreateIndex
CREATE INDEX `AnswerOption_questionId_idx` ON `AnswerOption`(`questionId`);

-- CreateIndex
CREATE INDEX `ContentBlock_lessonId_idx` ON `ContentBlock`(`lessonId`);

-- CreateIndex
CREATE INDEX `Course_instructorId_idx` ON `Course`(`instructorId`);

-- CreateIndex
CREATE INDEX `CourseProgress_userId_idx` ON `CourseProgress`(`userId`);

-- CreateIndex
CREATE INDEX `CourseProgress_courseId_idx` ON `CourseProgress`(`courseId`);

-- CreateIndex
CREATE UNIQUE INDEX `CourseProgress_userId_courseId_key` ON `CourseProgress`(`userId`, `courseId`);

-- CreateIndex
CREATE INDEX `Enrollment_userId_idx` ON `Enrollment`(`userId`);

-- CreateIndex
CREATE INDEX `Enrollment_courseId_idx` ON `Enrollment`(`courseId`);

-- CreateIndex
CREATE INDEX `FormField_formId_idx` ON `FormField`(`formId`);

-- CreateIndex
CREATE INDEX `FormResponse_formId_userId_idx` ON `FormResponse`(`formId`, `userId`);

-- CreateIndex
CREATE INDEX `Lesson_moduleId_idx` ON `Lesson`(`moduleId`);

-- CreateIndex
CREATE INDEX `LessonCompletionRecord_lessonId_idx` ON `LessonCompletionRecord`(`lessonId`);

-- CreateIndex
CREATE INDEX `Module_courseId_idx` ON `Module`(`courseId`);

-- CreateIndex
CREATE INDEX `Notification_userId_idx` ON `Notification`(`userId`);

-- CreateIndex
CREATE INDEX `Question_quizId_idx` ON `Question`(`quizId`);

-- CreateIndex
CREATE INDEX `QuizAttempt_userId_quizId_idx` ON `QuizAttempt`(`userId`, `quizId`);

-- CreateIndex
CREATE INDEX `Resource_parentId_idx` ON `Resource`(`parentId`);

-- CreateIndex
CREATE INDEX `SecurityLog_userId_idx` ON `SecurityLog`(`userId`);

-- CreateIndex
CREATE INDEX `SecurityLog_event_idx` ON `SecurityLog`(`event`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentBlock` ADD CONSTRAINT `ContentBlock_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_contentBlockId_fkey` FOREIGN KEY (`contentBlockId`) REFERENCES `ContentBlock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerOption` ADD CONSTRAINT `AnswerOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_progressId_fkey` FOREIGN KEY (`progressId`) REFERENCES `CourseProgress`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `QuizAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `AnswerOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Resource`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonTemplate` ADD CONSTRAINT `LessonTemplate_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateBlock` ADD CONSTRAINT `TemplateBlock_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `LessonTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormField` ADD CONSTRAINT `FormField_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponse` ADD CONSTRAINT `FormResponse_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponse` ADD CONSTRAINT `FormResponse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormAnswer` ADD CONSTRAINT `FormAnswer_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `FormResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormAnswer` ADD CONSTRAINT `FormAnswer_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `FormField`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_A_fkey` FOREIGN KEY (`A`) REFERENCES `CalendarEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceSharedWith` ADD CONSTRAINT `_ResourceSharedWith_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceSharedWith` ADD CONSTRAINT `_ResourceSharedWith_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FormSharedWith` ADD CONSTRAINT `_FormSharedWith_A_fkey` FOREIGN KEY (`A`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FormSharedWith` ADD CONSTRAINT `_FormSharedWith_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
