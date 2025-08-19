/*
  Warnings:

  - You are about to alter the column `audienceType` on the `calendarevent` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.
  - You are about to drop the column `templateBlockId` on the `contentblock` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `lessoncompletionrecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lessontemplate` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `module` table. All the data in the column will be lost.
  - The primary key for the `platformsettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `learningpath` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `learningpathcourse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `learningpathenrollment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registeredDate` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `announcement` DROP FOREIGN KEY `Announcement_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `contentblock` DROP FOREIGN KEY `ContentBlock_templateBlockId_fkey`;

-- DropForeignKey
ALTER TABLE `learningpathcourse` DROP FOREIGN KEY `LearningPathCourse_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `learningpathcourse` DROP FOREIGN KEY `LearningPathCourse_pathId_fkey`;

-- DropForeignKey
ALTER TABLE `learningpathenrollment` DROP FOREIGN KEY `LearningPathEnrollment_pathId_fkey`;

-- DropForeignKey
ALTER TABLE `learningpathenrollment` DROP FOREIGN KEY `LearningPathEnrollment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `Resource_parentId_fkey`;

-- DropIndex
DROP INDEX `ContentBlock_templateBlockId_key` ON `contentblock`;

-- AlterTable
ALTER TABLE `announcement` MODIFY `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `authorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `answeroption` ALTER COLUMN `isCorrect` DROP DEFAULT;

-- AlterTable
ALTER TABLE `calendarevent` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `audienceType` ENUM('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC') NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE `contentblock` DROP COLUMN `templateBlockId`;

-- AlterTable
ALTER TABLE `course` MODIFY `description` TEXT NOT NULL,
    MODIFY `imageUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `lessoncompletionrecord` DROP COLUMN `completedAt`;

-- AlterTable
ALTER TABLE `lessontemplate` DROP COLUMN `createdAt`,
    MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `module` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `platformsettings` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ALTER COLUMN `resourceCategories` DROP DEFAULT,
    ALTER COLUMN `primaryColor` DROP DEFAULT,
    ALTER COLUMN `secondaryColor` DROP DEFAULT,
    ALTER COLUMN `accentColor` DROP DEFAULT,
    ALTER COLUMN `backgroundColorLight` DROP DEFAULT,
    ALTER COLUMN `primaryColorDark` DROP DEFAULT,
    ALTER COLUMN `backgroundColorDark` DROP DEFAULT,
    ALTER COLUMN `fontHeadline` DROP DEFAULT,
    ALTER COLUMN `fontBody` DROP DEFAULT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `question` ALTER COLUMN `type` DROP DEFAULT;

-- AlterTable
ALTER TABLE `quiz` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `resource` MODIFY `category` VARCHAR(191) NULL,
    MODIFY `tags` VARCHAR(191) NULL,
    MODIFY `url` TEXT NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `details` TEXT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0,
    MODIFY `avatar` TEXT NULL,
    MODIFY `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `twoFactorSecret` TEXT NULL;

-- DropTable
DROP TABLE `learningpath`;

-- DropTable
DROP TABLE `learningpathcourse`;

-- DropTable
DROP TABLE `learningpathenrollment`;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Achievement_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAchievement` (
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `achievementId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
