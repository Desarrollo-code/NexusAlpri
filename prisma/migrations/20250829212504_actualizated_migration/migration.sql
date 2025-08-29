/*
  Warnings:

  - You are about to drop the column `quizAttemptId` on the `answerattempt` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `answeroption` table. All the data in the column will be lost.
  - You are about to drop the column `fontBody` on the `platformsettings` table. All the data in the column will be lost.
  - You are about to drop the column `fontHeadline` on the `platformsettings` table. All the data in the column will be lost.
  - You are about to drop the `_lessontotemplate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attemptId` to the `AnswerAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Made the column `resourceCategories` on table `platformsettings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `AnswerAttempt_quizAttemptId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `QuizAttempt_userId_quizId_idx` ON `quizattempt`;

-- DropIndex
DROP INDEX `SecurityLog_createdAt_idx` ON `securitylog`;

-- AlterTable
ALTER TABLE `announcement` MODIFY `priority` VARCHAR(191) NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE `answerattempt` DROP COLUMN `quizAttemptId`,
    ADD COLUMN `attemptId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `answeroption` DROP COLUMN `points`;

-- AlterTable
ALTER TABLE `calendarevent` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `color` VARCHAR(191) NULL DEFAULT 'blue';

-- AlterTable
ALTER TABLE `course` MODIFY `instructorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `courseprogress` MODIFY `progressPercentage` DOUBLE NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `lesson` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `lessontemplate` MODIFY `type` ENUM('SYSTEM', 'USER') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `module` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `platformsettings` DROP COLUMN `fontBody`,
    DROP COLUMN `fontHeadline`,
    MODIFY `emailWhitelist` TEXT NULL,
    MODIFY `resourceCategories` TEXT NOT NULL DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General',
    MODIFY `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'SINGLE_CHOICE',
    MODIFY `text` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `resource` MODIFY `pin` TEXT NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `userAgent` TEXT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR') NOT NULL DEFAULT 'STUDENT',
    MODIFY `xp` INTEGER NULL DEFAULT 0;

-- DropTable
DROP TABLE `_lessontotemplate`;

-- CreateIndex
CREATE INDEX `AnswerAttempt_attemptId_idx` ON `AnswerAttempt`(`attemptId`);

-- CreateIndex
CREATE INDEX `FormAnswer_fieldId_idx` ON `FormAnswer`(`fieldId`);

-- CreateIndex
CREATE INDEX `LessonCompletionRecord_progressId_idx` ON `LessonCompletionRecord`(`progressId`);

-- CreateIndex
CREATE INDEX `LessonCompletionRecord_lessonId_idx` ON `LessonCompletionRecord`(`lessonId`);

-- CreateIndex
CREATE INDEX `QuizAttempt_userId_idx` ON `QuizAttempt`(`userId`);

-- CreateIndex
CREATE INDEX `QuizAttempt_quizId_idx` ON `QuizAttempt`(`quizId`);

-- CreateIndex
CREATE INDEX `SecurityLog_event_idx` ON `SecurityLog`(`event`);

-- CreateIndex
CREATE INDEX `UserAchievement_userId_idx` ON `UserAchievement`(`userId`);

-- CreateIndex
CREATE INDEX `UserNote_userId_idx` ON `UserNote`(`userId`);
