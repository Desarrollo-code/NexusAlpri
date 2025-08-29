/*
  Warnings:

  - You are about to alter the column `slug` on the `achievement` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(9))`.
  - You are about to drop the column `attemptId` on the `answerattempt` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `contentblock` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `question` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `resource` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `VarChar(191)`.
  - The primary key for the `userachievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `userachievement` table. All the data in the column will be lost.
  - You are about to drop the `_sharedforms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `formresponseanswer` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `LessonTemplate` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `achievement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `quizAttemptId` to the `AnswerAttempt` table without a default value. This is not possible if the table is not empty.
  - Made the column `xp` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Announcement_authorId_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AnswerAttempt_attemptId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `AnswerOption_questionId_idx` ON `answeroption`;

-- DropIndex
DROP INDEX `CalendarEvent_creatorId_idx` ON `calendarevent`;

-- DropIndex
DROP INDEX `ContentBlock_lessonId_idx` ON `contentblock`;

-- DropIndex
DROP INDEX `Course_category_idx` ON `course`;

-- DropIndex
DROP INDEX `Course_instructorId_idx` ON `course`;

-- DropIndex
DROP INDEX `Course_status_idx` ON `course`;

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
DROP INDEX `SecurityLog_event_idx` ON `securitylog`;

-- DropIndex
DROP INDEX `SecurityLog_userId_idx` ON `securitylog`;

-- DropIndex
DROP INDEX `TemplateBlock_templateId_idx` ON `templateblock`;

-- DropIndex
DROP INDEX `User_email_idx` ON `user`;

-- DropIndex
DROP INDEX `UserAchievement_userId_achievementId_key` ON `userachievement`;

-- AlterTable
ALTER TABLE `achievement` MODIFY `slug` ENUM('FIRST_ENROLLMENT', 'FIRST_COURSE_COMPLETED', 'PERFECT_SCORE', 'FIVE_COURSES_COMPLETED') NOT NULL,
    MODIFY `icon` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `answerattempt` DROP COLUMN `attemptId`,
    ADD COLUMN `quizAttemptId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `answeroption` ALTER COLUMN `isCorrect` DROP DEFAULT,
    MODIFY `feedback` TEXT NULL;

-- AlterTable
ALTER TABLE `calendarevent` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `contentblock` DROP COLUMN `createdAt`;

-- AlterTable
ALTER TABLE `course` MODIFY `imageUrl` VARCHAR(1024) NULL,
    MODIFY `instructorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `courseprogress` MODIFY `lastActivity` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `form` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `module` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `platformsettings` MODIFY `logoUrl` VARCHAR(1024) NULL,
    MODIFY `watermarkUrl` VARCHAR(1024) NULL,
    MODIFY `landingImageUrl` VARCHAR(1024) NULL,
    MODIFY `authImageUrl` VARCHAR(1024) NULL,
    MODIFY `aboutImageUrl` VARCHAR(1024) NULL,
    MODIFY `benefitsImageUrl` VARCHAR(1024) NULL;

-- AlterTable
ALTER TABLE `question` DROP COLUMN `createdAt`;

-- AlterTable
ALTER TABLE `quiz` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `resource` ADD COLUMN `hasPin` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `description` TEXT NULL,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `url` VARCHAR(1024) NULL,
    MODIFY `tags` TEXT NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `userAgent` TEXT NULL,
    MODIFY `details` TEXT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `theme` VARCHAR(191) NULL DEFAULT 'dark',
    MODIFY `xp` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `userachievement` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`userId`, `achievementId`);

-- DropTable
DROP TABLE `_sharedforms`;

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
CREATE TABLE `_FormSharedWith` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FormSharedWith_AB_unique`(`A`, `B`),
    INDEX `_FormSharedWith_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `LessonTemplate_name_key` ON `LessonTemplate`(`name`);
