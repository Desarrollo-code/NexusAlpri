/*
  Warnings:

  - You are about to alter the column `audienceType` on the `calendarevent` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `VarChar(191)`.
  - The primary key for the `courseprogress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `courseprogress` table. All the data in the column will be lost.
  - You are about to drop the `_completedlessons` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `instructorId` on table `course` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `CourseProgress` table without a default value. This is not possible if the table is not empty.
  - Made the column `uploaderId` on table `resource` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `_completedlessons` DROP FOREIGN KEY `_CompletedLessons_A_fkey`;

-- DropForeignKey
ALTER TABLE `_completedlessons` DROP FOREIGN KEY `_CompletedLessons_B_fkey`;

-- DropForeignKey
ALTER TABLE `course` DROP FOREIGN KEY `Course_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `Resource_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `Resource_uploaderId_fkey`;

-- DropIndex
DROP INDEX `CourseProgress_userId_courseId_key` ON `courseprogress`;

-- AlterTable
ALTER TABLE `announcement` ADD COLUMN `priority` VARCHAR(191) NULL,
    MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `answeroption` MODIFY `feedback` TEXT NULL;

-- AlterTable
ALTER TABLE `calendarevent` MODIFY `allDay` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `audienceType` VARCHAR(191) NOT NULL,
    ALTER COLUMN `color` DROP DEFAULT;

-- AlterTable
ALTER TABLE `course` MODIFY `instructorId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `courseprogress` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`userId`, `courseId`);

-- AlterTable
ALTER TABLE `platformsettings` MODIFY `resourceCategories` TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `question` MODIFY `text` TEXT NOT NULL,
    MODIFY `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE') NOT NULL;

-- AlterTable
ALTER TABLE `resource` ADD COLUMN `description` TEXT NULL,
    MODIFY `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    MODIFY `uploaderId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT';

-- DropTable
DROP TABLE `_completedlessons`;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
