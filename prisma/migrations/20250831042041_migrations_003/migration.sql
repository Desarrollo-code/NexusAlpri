/*
  Warnings:

  - You are about to drop the column `createdAt` on the `calendarevent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `calendarevent` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `templateblock` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_attendedevents` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sourceLessonId]` on the table `LessonTemplate` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `achievement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `priority` on table `announcement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `ContentBlock` table without a default value. This is not possible if the table is not empty.
  - Made the column `instructorId` on table `course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `progressPercentage` on table `courseprogress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enrollmentId` on table `courseprogress` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lessonTemplateId` to the `TemplateBlock` table without a default value. This is not possible if the table is not empty.
  - Made the column `xp` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `SecurityLog_event_idx` ON `securitylog`;

-- DropIndex
DROP INDEX `TemplateBlock_templateId_idx` ON `templateblock`;

-- DropIndex
DROP INDEX `User_email_idx` ON `user`;

-- AlterTable
ALTER TABLE `achievement` MODIFY `icon` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `announcement` MODIFY `content` VARCHAR(191) NOT NULL,
    MODIFY `priority` VARCHAR(191) NOT NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE `answeroption` MODIFY `feedback` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `calendarevent` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    MODIFY `description` VARCHAR(191) NULL,
    ALTER COLUMN `color` DROP DEFAULT;

-- AlterTable
ALTER TABLE `contentblock` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `content` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `course` MODIFY `description` VARCHAR(191) NULL,
    MODIFY `instructorId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `courseprogress` ADD COLUMN `lastActivity` DATETIME(3) NULL,
    MODIFY `progressPercentage` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `enrollmentId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `form` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `formanswer` MODIFY `value` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `lessontemplate` ADD COLUMN `sourceLessonId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `platformsettings` ALTER COLUMN `platformName` DROP DEFAULT,
    MODIFY `emailWhitelist` VARCHAR(191) NULL,
    MODIFY `resourceCategories` VARCHAR(191) NOT NULL DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General',
    MODIFY `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true,
    ALTER COLUMN `primaryColor` DROP DEFAULT,
    ALTER COLUMN `secondaryColor` DROP DEFAULT,
    ALTER COLUMN `accentColor` DROP DEFAULT,
    ALTER COLUMN `backgroundColorLight` DROP DEFAULT,
    ALTER COLUMN `primaryColorDark` DROP DEFAULT,
    ALTER COLUMN `backgroundColorDark` DROP DEFAULT;

-- AlterTable
ALTER TABLE `question` DROP COLUMN `type`;

-- AlterTable
ALTER TABLE `resource` MODIFY `description` VARCHAR(191) NULL,
    MODIFY `pin` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `userAgent` VARCHAR(191) NULL,
    MODIFY `details` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `templateblock` DROP COLUMN `templateId`,
    ADD COLUMN `lessonTemplateId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `theme`,
    MODIFY `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    MODIFY `xp` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `usernote` MODIFY `content` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_attendedevents`;

-- CreateTable
CREATE TABLE `_EventAttendees` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EventAttendees_AB_unique`(`A`, `B`),
    INDEX `_EventAttendees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AnswerAttempt_questionId_idx` ON `AnswerAttempt`(`questionId`);

-- CreateIndex
CREATE INDEX `AnswerAttempt_selectedOptionId_idx` ON `AnswerAttempt`(`selectedOptionId`);

-- CreateIndex
CREATE UNIQUE INDEX `LessonTemplate_sourceLessonId_key` ON `LessonTemplate`(`sourceLessonId`);

-- CreateIndex
CREATE INDEX `TemplateBlock_lessonTemplateId_idx` ON `TemplateBlock`(`lessonTemplateId`);

-- CreateIndex
CREATE INDEX `UserAchievement_achievementId_idx` ON `UserAchievement`(`achievementId`);

-- CreateIndex
CREATE INDEX `UserNote_lessonId_idx` ON `UserNote`(`lessonId`);
