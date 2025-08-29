/*
  Warnings:

  - You are about to alter the column `imageUrl` on the `course` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `type` on the `lessontemplate` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `VarChar(191)`.
  - You are about to alter the column `logoUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `watermarkUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `landingImageUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `authImageUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `aboutImageUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `benefitsImageUrl` on the `platformsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - You are about to alter the column `type` on the `resource` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - You are about to alter the column `url` on the `resource` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(191)`.
  - The primary key for the `userachievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_formsharedwith` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,achievementId]` on the table `UserAchievement` will be added. If there are existing duplicate values, this will fail.
  - Made the column `instructorId` on table `course` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX `CourseProgress_userId_courseId_key` ON `courseprogress`;

-- DropIndex
DROP INDEX `LessonTemplate_name_key` ON `lessontemplate`;

-- AlterTable
ALTER TABLE `announcement` ALTER COLUMN `date` DROP DEFAULT,
    MODIFY `priority` VARCHAR(191) NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE `answeroption` ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `course` MODIFY `imageUrl` VARCHAR(191) NULL,
    MODIFY `instructorId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `courseprogress` MODIFY `progressPercentage` DOUBLE NULL;

-- AlterTable
ALTER TABLE `formfield` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING') NOT NULL;

-- AlterTable
ALTER TABLE `lessontemplate` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `platformsettings` MODIFY `emailWhitelist` VARCHAR(191) NULL,
    MODIFY `resourceCategories` TEXT NULL,
    MODIFY `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `logoUrl` VARCHAR(191) NULL,
    MODIFY `watermarkUrl` VARCHAR(191) NULL,
    MODIFY `landingImageUrl` VARCHAR(191) NULL,
    MODIFY `authImageUrl` VARCHAR(191) NULL,
    MODIFY `aboutImageUrl` VARCHAR(191) NULL,
    MODIFY `benefitsImageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `question` MODIFY `text` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `quiz` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `resource` MODIFY `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'EXTERNAL_LINK', 'OTHER') NOT NULL DEFAULT 'DOCUMENT',
    MODIFY `url` VARCHAR(191) NULL,
    MODIFY `tags` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `details` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `password` VARCHAR(191) NULL,
    ALTER COLUMN `theme` DROP DEFAULT,
    MODIFY `xp` INTEGER NULL;

-- AlterTable
ALTER TABLE `userachievement` DROP PRIMARY KEY,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `_formsharedwith`;

-- CreateTable
CREATE TABLE `_FormToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FormToUser_AB_unique`(`A`, `B`),
    INDEX `_FormToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `LessonTemplate_creatorId_idx` ON `LessonTemplate`(`creatorId`);

-- CreateIndex
CREATE UNIQUE INDEX `UserAchievement_userId_achievementId_key` ON `UserAchievement`(`userId`, `achievementId`);
