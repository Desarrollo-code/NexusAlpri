/*
  Warnings:

  - You are about to alter the column `audienceType` on the `calendarevent` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.
  - You are about to drop the column `createdAt` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lesson` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `lessontemplate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.
  - You are about to drop the column `createdAt` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `emailAttempt` on the `securitylog` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `user` table. All the data in the column will be lost.
  - The primary key for the `userachievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `userachievement` table. All the data in the column will be lost.
  - You are about to drop the `_attendedevents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `formresponseanswer` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `course` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Announcement_authorId_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AnswerAttempt_attemptId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `AnswerAttempt_questionId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `AnswerOption_questionId_idx` ON `answeroption`;

-- DropIndex
DROP INDEX `CalendarEvent_creatorId_idx` ON `calendarevent`;

-- DropIndex
DROP INDEX `ContentBlock_lessonId_idx` ON `contentblock`;

-- DropIndex
DROP INDEX `Course_instructorId_idx` ON `course`;

-- DropIndex
DROP INDEX `CourseProgress_courseId_idx` ON `courseprogress`;

-- DropIndex
DROP INDEX `CourseProgress_userId_courseId_key` ON `courseprogress`;

-- DropIndex
DROP INDEX `CourseProgress_userId_idx` ON `courseprogress`;

-- DropIndex
DROP INDEX `Enrollment_courseId_idx` ON `enrollment`;

-- DropIndex
DROP INDEX `Enrollment_userId_idx` ON `enrollment`;

-- DropIndex
DROP INDEX `Form_creatorId_idx` ON `form`;

-- DropIndex
DROP INDEX `FormField_formId_idx` ON `formfield`;

-- DropIndex
DROP INDEX `FormResponse_formId_idx` ON `formresponse`;

-- DropIndex
DROP INDEX `FormResponse_userId_idx` ON `formresponse`;

-- DropIndex
DROP INDEX `Lesson_moduleId_idx` ON `lesson`;

-- DropIndex
DROP INDEX `LessonCompletionRecord_lessonId_idx` ON `lessoncompletionrecord`;

-- DropIndex
DROP INDEX `LessonCompletionRecord_progressId_idx` ON `lessoncompletionrecord`;

-- DropIndex
DROP INDEX `LessonTemplate_creatorId_idx` ON `lessontemplate`;

-- DropIndex
DROP INDEX `Module_courseId_idx` ON `module`;

-- DropIndex
DROP INDEX `Notification_userId_idx` ON `notification`;

-- DropIndex
DROP INDEX `Question_quizId_idx` ON `question`;

-- DropIndex
DROP INDEX `QuizAttempt_quizId_idx` ON `quizattempt`;

-- DropIndex
DROP INDEX `QuizAttempt_userId_idx` ON `quizattempt`;

-- DropIndex
DROP INDEX `Resource_parentId_idx` ON `resource`;

-- DropIndex
DROP INDEX `Resource_uploaderId_idx` ON `resource`;

-- DropIndex
DROP INDEX `SecurityLog_createdAt_idx` ON `securitylog`;

-- DropIndex
DROP INDEX `SecurityLog_userId_idx` ON `securitylog`;

-- DropIndex
DROP INDEX `TemplateBlock_templateId_idx` ON `templateblock`;

-- DropIndex
DROP INDEX `UserAchievement_userId_achievementId_key` ON `userachievement`;

-- DropIndex
DROP INDEX `UserAchievement_userId_idx` ON `userachievement`;

-- DropIndex
DROP INDEX `UserNote_userId_idx` ON `usernote`;

-- AlterTable
ALTER TABLE `achievement` MODIFY `points` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `announcement` ALTER COLUMN `priority` DROP DEFAULT,
    MODIFY `audience` VARCHAR(191) NOT NULL DEFAULT '"ALL"';

-- AlterTable
ALTER TABLE `answeroption` ADD COLUMN `points` INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `calendarevent` ALTER COLUMN `color` DROP DEFAULT,
    MODIFY `audienceType` ENUM('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC') NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE `course` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `form` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `lessontemplate` ADD COLUMN `lessonId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('SYSTEM', 'USER') NOT NULL;

-- AlterTable
ALTER TABLE `module` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `platformsettings` MODIFY `primaryColor` VARCHAR(191) NULL DEFAULT '#6366f1',
    MODIFY `secondaryColor` VARCHAR(191) NULL DEFAULT '#a5b4fc',
    MODIFY `accentColor` VARCHAR(191) NULL DEFAULT '#ec4899',
    MODIFY `backgroundColorLight` VARCHAR(191) NULL DEFAULT '#f8fafc',
    MODIFY `primaryColorDark` VARCHAR(191) NULL DEFAULT '#a5b4fc',
    MODIFY `backgroundColorDark` VARCHAR(191) NULL DEFAULT '#020617',
    MODIFY `fontHeadline` VARCHAR(191) NULL DEFAULT 'Space Grotesk',
    MODIFY `fontBody` VARCHAR(191) NULL DEFAULT 'Inter',
    MODIFY `resourceCategories` VARCHAR(191) NOT NULL DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General',
    MODIFY `emailWhitelist` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `resource` ADD COLUMN `hasPin` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `pin` TEXT NULL;

-- AlterTable
ALTER TABLE `securitylog` DROP COLUMN `emailAttempt`,
    MODIFY `userAgent` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `lastLogin`,
    ADD COLUMN `theme` VARCHAR(191) NULL,
    MODIFY `registeredDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `xp` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `userachievement` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`userId`, `achievementId`);

-- DropTable
DROP TABLE `_attendedevents`;

-- DropTable
DROP TABLE `formresponseanswer`;

-- CreateTable
CREATE TABLE `FormAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `responseId` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventAttendees` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EventAttendees_AB_unique`(`A`, `B`),
    INDEX `_EventAttendees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `QuizAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `AnswerOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_progressId_fkey` FOREIGN KEY (`progressId`) REFERENCES `CourseProgress`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Resource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonTemplate` ADD CONSTRAINT `LessonTemplate_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonTemplate` ADD CONSTRAINT `LessonTemplate_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `_SharedResources` ADD CONSTRAINT `_SharedResources_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedResources` ADD CONSTRAINT `_SharedResources_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_A_fkey` FOREIGN KEY (`A`) REFERENCES `CalendarEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedForms` ADD CONSTRAINT `_SharedForms_A_fkey` FOREIGN KEY (`A`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedForms` ADD CONSTRAINT `_SharedForms_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
