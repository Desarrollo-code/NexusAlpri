/*
  Warnings:

  - You are about to drop the column `attemptId` on the `answerattempt` table. All the data in the column will be lost.
  - The primary key for the `userachievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_sharedresources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessontemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `templateblock` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseProgress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,achievementId]` on the table `UserAchievement` will be added. If there are existing duplicate values, this will fail.
  - Made the column `audience` on table `announcement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `quizAttemptId` to the `AnswerAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attemptNumber` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX `Achievement_slug_idx` ON `achievement`;

-- DropIndex
DROP INDEX `AnswerAttempt_attemptId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `AnswerAttempt_questionId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `AnswerAttempt_selectedOptionId_idx` ON `answerattempt`;

-- DropIndex
DROP INDEX `CourseProgress_courseId_idx` ON `courseprogress`;

-- DropIndex
DROP INDEX `CourseProgress_userId_idx` ON `courseprogress`;

-- DropIndex
DROP INDEX `LessonCompletionRecord_lessonId_idx` ON `lessoncompletionrecord`;

-- DropIndex
DROP INDEX `QuizAttempt_quizId_idx` ON `quizattempt`;

-- DropIndex
DROP INDEX `QuizAttempt_userId_idx` ON `quizattempt`;

-- DropIndex
DROP INDEX `UserAchievement_achievementId_idx` ON `userachievement`;

-- DropIndex
DROP INDEX `UserAchievement_userId_idx` ON `userachievement`;

-- DropIndex
DROP INDEX `UserNote_lessonId_idx` ON `usernote`;

-- DropIndex
DROP INDEX `UserNote_userId_idx` ON `usernote`;

-- AlterTable
ALTER TABLE `achievement` ALTER COLUMN `points` DROP DEFAULT;

-- AlterTable
ALTER TABLE `announcement` MODIFY `authorId` VARCHAR(191) NULL,
    MODIFY `audience` JSON NOT NULL;

-- AlterTable
ALTER TABLE `answerattempt` DROP COLUMN `attemptId`,
    ADD COLUMN `quizAttemptId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `answeroption` ALTER COLUMN `isCorrect` DROP DEFAULT,
    MODIFY `feedback` TEXT NULL;

-- AlterTable
ALTER TABLE `calendarevent` MODIFY `audienceType` ENUM('ALL', 'STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR', 'SPECIFIC') NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE `course` MODIFY `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `courseprogress` ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `lastActivity` DATETIME(3) NULL,
    ALTER COLUMN `progressPercentage` DROP DEFAULT;

-- AlterTable
ALTER TABLE `platformsettings` MODIFY `logoUrl` VARCHAR(191) NULL,
    MODIFY `watermarkUrl` VARCHAR(191) NULL,
    MODIFY `landingImageUrl` VARCHAR(191) NULL,
    MODIFY `authImageUrl` VARCHAR(191) NULL,
    MODIFY `aboutImageUrl` VARCHAR(191) NULL,
    MODIFY `benefitsImageUrl` VARCHAR(191) NULL,
    ALTER COLUMN `primaryColor` DROP DEFAULT,
    ALTER COLUMN `secondaryColor` DROP DEFAULT,
    ALTER COLUMN `accentColor` DROP DEFAULT,
    ALTER COLUMN `backgroundColorLight` DROP DEFAULT,
    ALTER COLUMN `primaryColorDark` DROP DEFAULT,
    ALTER COLUMN `backgroundColorDark` DROP DEFAULT,
    ALTER COLUMN `fontHeadline` DROP DEFAULT,
    ALTER COLUMN `fontBody` DROP DEFAULT;

-- AlterTable
ALTER TABLE `question` MODIFY `text` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `quiz` ADD COLUMN `maxAttempts` INTEGER NULL;

-- AlterTable
ALTER TABLE `quizattempt` ADD COLUMN `attemptNumber` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `securitylog` MODIFY `userAgent` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR') NOT NULL DEFAULT 'STUDENT',
    MODIFY `avatar` VARCHAR(191) NULL,
    ALTER COLUMN `theme` DROP DEFAULT;

-- AlterTable
ALTER TABLE `userachievement` DROP PRIMARY KEY,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `_sharedresources`;

-- DropTable
DROP TABLE `lessontemplate`;

-- DropTable
DROP TABLE `resource`;

-- DropTable
DROP TABLE `templateblock`;

-- CreateTable
CREATE TABLE `EnterpriseResource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'EXTERNAL_LINK', 'OTHER') NOT NULL,
    `category` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploaderId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `hasPin` BOOLEAN NOT NULL DEFAULT false,
    `pin` VARCHAR(191) NULL,
    `ispublic` BOOLEAN NOT NULL DEFAULT true,

    INDEX `EnterpriseResource_parentId_idx`(`parentId`),
    INDEX `EnterpriseResource_uploaderId_idx`(`uploaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SharedResourceWithUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_SharedResourceWithUser_AB_unique`(`A`, `B`),
    INDEX `_SharedResourceWithUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SharedFormWithUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_SharedFormWithUser_AB_unique`(`A`, `B`),
    INDEX `_SharedFormWithUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AnswerAttempt_quizAttemptId_idx` ON `AnswerAttempt`(`quizAttemptId`);

-- CreateIndex
CREATE INDEX `CourseProgress_enrollmentId_idx` ON `CourseProgress`(`enrollmentId`);

-- CreateIndex
CREATE UNIQUE INDEX `CourseProgress_userId_courseId_key` ON `CourseProgress`(`userId`, `courseId`);

-- CreateIndex
CREATE INDEX `QuizAttempt_userId_quizId_idx` ON `QuizAttempt`(`userId`, `quizId`);

-- CreateIndex
CREATE INDEX `SecurityLog_event_idx` ON `SecurityLog`(`event`);

-- CreateIndex
CREATE UNIQUE INDEX `UserAchievement_userId_achievementId_key` ON `UserAchievement`(`userId`, `achievementId`);

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
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_progressId_fkey` FOREIGN KEY (`progressId`) REFERENCES `CourseProgress`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonCompletionRecord` ADD CONSTRAINT `LessonCompletionRecord_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_quizAttemptId_fkey` FOREIGN KEY (`quizAttemptId`) REFERENCES `QuizAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttempt` ADD CONSTRAINT `AnswerAttempt_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `AnswerOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnterpriseResource` ADD CONSTRAINT `EnterpriseResource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnterpriseResource` ADD CONSTRAINT `EnterpriseResource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `EnterpriseResource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `_SharedResourceWithUser` ADD CONSTRAINT `_SharedResourceWithUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `EnterpriseResource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedResourceWithUser` ADD CONSTRAINT `_SharedResourceWithUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_A_fkey` FOREIGN KEY (`A`) REFERENCES `CalendarEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedFormWithUser` ADD CONSTRAINT `_SharedFormWithUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedFormWithUser` ADD CONSTRAINT `_SharedFormWithUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
