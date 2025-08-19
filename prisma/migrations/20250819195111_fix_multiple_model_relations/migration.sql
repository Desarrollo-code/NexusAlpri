/*
  Warnings:

  - You are about to alter the column `type` on the `lessontemplate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.
  - You are about to drop the column `templateId` on the `templateblock` table. All the data in the column will be lost.
  - The primary key for the `userachievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_eventattendees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enterprise_resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lesson_completion_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,achievementId]` on the table `UserAchievement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `LessonTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lessonTemplateId` to the `TemplateBlock` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE `_eventattendees` DROP FOREIGN KEY `_EventAttendees_A_fkey`;

-- DropForeignKey
ALTER TABLE `_eventattendees` DROP FOREIGN KEY `_EventAttendees_B_fkey`;

-- DropForeignKey
ALTER TABLE `_sharedresources` DROP FOREIGN KEY `_SharedResources_A_fkey`;

-- DropForeignKey
ALTER TABLE `_sharedresources` DROP FOREIGN KEY `_SharedResources_B_fkey`;

-- DropForeignKey
ALTER TABLE `announcements` DROP FOREIGN KEY `announcements_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_attempts` DROP FOREIGN KEY `answer_attempts_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_attempts` DROP FOREIGN KEY `answer_attempts_quizAttemptId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_attempts` DROP FOREIGN KEY `answer_attempts_selectedOptionId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_options` DROP FOREIGN KEY `answer_options_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `calendar_events` DROP FOREIGN KEY `calendar_events_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `content_blocks` DROP FOREIGN KEY `content_blocks_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `course_progress` DROP FOREIGN KEY `course_progress_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `course_progress` DROP FOREIGN KEY `course_progress_enrollmentId_fkey`;

-- DropForeignKey
ALTER TABLE `course_progress` DROP FOREIGN KEY `course_progress_userId_fkey`;

-- DropForeignKey
ALTER TABLE `courses` DROP FOREIGN KEY `courses_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_userId_fkey`;

-- DropForeignKey
ALTER TABLE `enterprise_resources` DROP FOREIGN KEY `enterprise_resources_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `enterprise_resources` DROP FOREIGN KEY `enterprise_resources_uploaderId_fkey`;

-- DropForeignKey
ALTER TABLE `lesson_completion_records` DROP FOREIGN KEY `lesson_completion_records_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `lesson_completion_records` DROP FOREIGN KEY `lesson_completion_records_progressId_fkey`;

-- DropForeignKey
ALTER TABLE `lessons` DROP FOREIGN KEY `lessons_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `lessontemplate` DROP FOREIGN KEY `LessonTemplate_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `modules` DROP FOREIGN KEY `modules_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `questions` DROP FOREIGN KEY `questions_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `quiz_attempts` DROP FOREIGN KEY `quiz_attempts_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `quiz_attempts` DROP FOREIGN KEY `quiz_attempts_userId_fkey`;

-- DropForeignKey
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_contentBlockId_fkey`;

-- DropForeignKey
ALTER TABLE `security_logs` DROP FOREIGN KEY `security_logs_userId_fkey`;

-- DropForeignKey
ALTER TABLE `templateblock` DROP FOREIGN KEY `TemplateBlock_templateId_fkey`;

-- DropForeignKey
ALTER TABLE `user_notes` DROP FOREIGN KEY `user_notes_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `user_notes` DROP FOREIGN KEY `user_notes_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userachievement` DROP FOREIGN KEY `UserAchievement_userId_fkey`;

-- DropIndex
DROP INDEX `LessonTemplate_name_key` ON `lessontemplate`;

-- AlterTable
ALTER TABLE `lessontemplate` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `type` ENUM('SYSTEM', 'USER') NOT NULL;

-- AlterTable
ALTER TABLE `templateblock` DROP COLUMN `templateId`,
    ADD COLUMN `lessonTemplateId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `userachievement` DROP PRIMARY KEY,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `_eventattendees`;

-- DropTable
DROP TABLE `announcements`;

-- DropTable
DROP TABLE `answer_attempts`;

-- DropTable
DROP TABLE `answer_options`;

-- DropTable
DROP TABLE `calendar_events`;

-- DropTable
DROP TABLE `content_blocks`;

-- DropTable
DROP TABLE `course_progress`;

-- DropTable
DROP TABLE `courses`;

-- DropTable
DROP TABLE `enrollments`;

-- DropTable
DROP TABLE `enterprise_resources`;

-- DropTable
DROP TABLE `lesson_completion_records`;

-- DropTable
DROP TABLE `lessons`;

-- DropTable
DROP TABLE `modules`;

-- DropTable
DROP TABLE `notifications`;

-- DropTable
DROP TABLE `platform_settings`;

-- DropTable
DROP TABLE `questions`;

-- DropTable
DROP TABLE `quiz_attempts`;

-- DropTable
DROP TABLE `quizzes`;

-- DropTable
DROP TABLE `security_logs`;

-- DropTable
DROP TABLE `user_notes`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `isTwoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `theme` VARCHAR(191) NULL,
    `xp` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `publicationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Module` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNote` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `UserNote_userId_lessonId_key`(`userId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentBlock` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'VIDEO', 'QUIZ', 'FILE') NOT NULL,
    `content` TEXT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contentBlockId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Quiz_contentBlockId_key`(`contentBlockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE') NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerOption` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `feedback` TEXT NULL,
    `questionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Enrollment_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `progressPercentage` DOUBLE NOT NULL DEFAULT 0,

    UNIQUE INDEX `CourseProgress_enrollmentId_key`(`enrollmentId`),
    UNIQUE INDEX `CourseProgress_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonCompletionRecord` (
    `id` VARCHAR(191) NOT NULL,
    `progressId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `score` DOUBLE NULL,

    UNIQUE INDEX `LessonCompletionRecord_progressId_lessonId_key`(`progressId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `quizAttemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selectedOptionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnterpriseResource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'EXTERNAL_LINK', 'OTHER') NOT NULL,
    `url` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` VARCHAR(191) NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pin` VARCHAR(191) NULL,
    `ispublic` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `uploaderId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Normal',
    `audience` JSON NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CalendarEvent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NULL,
    `videoConferenceLink` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'blue',
    `audienceType` ENUM('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC') NOT NULL DEFAULT 'ALL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `attachments` JSON NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'NexusAlpri',
    `logoUrl` VARCHAR(191) NULL,
    `watermarkUrl` VARCHAR(191) NULL,
    `landingImageUrl` VARCHAR(191) NULL,
    `authImageUrl` VARCHAR(191) NULL,
    `aboutImageUrl` VARCHAR(191) NULL,
    `benefitsImageUrl` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#a5b4fc',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#ec4899',
    `backgroundColorLight` VARCHAR(191) NOT NULL DEFAULT '#f8fafc',
    `primaryColorDark` VARCHAR(191) NOT NULL DEFAULT '#a5b4fc',
    `backgroundColorDark` VARCHAR(191) NOT NULL DEFAULT '#020617',
    `fontHeadline` VARCHAR(191) NOT NULL DEFAULT 'Space Grotesk',
    `fontBody` VARCHAR(191) NOT NULL DEFAULT 'Inter',
    `allowPublicRegistration` BOOLEAN NOT NULL DEFAULT true,
    `enableEmailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `require2faForAdmins` BOOLEAN NOT NULL DEFAULT false,
    `enableIdleTimeout` BOOLEAN NOT NULL DEFAULT true,
    `idleTimeoutMinutes` INTEGER NOT NULL DEFAULT 20,
    `resourceCategories` TEXT NOT NULL,
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireUppercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireLowercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireNumber` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('SUCCESSFUL_LOGIN', 'FAILED_LOGIN_ATTEMPT', 'PASSWORD_CHANGE_SUCCESS', 'PASSWORD_RESET_REQUEST', 'USER_ROLE_CHANGED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED') NOT NULL,
    `userId` VARCHAR(191) NULL,
    `emailAttempt` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AttendedEvents` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AttendedEvents_AB_unique`(`A`, `B`),
    INDEX `_AttendedEvents_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `UserAchievement_userId_achievementId_key` ON `UserAchievement`(`userId`, `achievementId`);

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNote` ADD CONSTRAINT `UserNote_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `EnterpriseResource` ADD CONSTRAINT `EnterpriseResource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `EnterpriseResource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnterpriseResource` ADD CONSTRAINT `EnterpriseResource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonTemplate` ADD CONSTRAINT `LessonTemplate_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateBlock` ADD CONSTRAINT `TemplateBlock_lessonTemplateId_fkey` FOREIGN KEY (`lessonTemplateId`) REFERENCES `LessonTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedResources` ADD CONSTRAINT `_SharedResources_A_fkey` FOREIGN KEY (`A`) REFERENCES `EnterpriseResource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SharedResources` ADD CONSTRAINT `_SharedResources_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendedEvents` ADD CONSTRAINT `_AttendedEvents_A_fkey` FOREIGN KEY (`A`) REFERENCES `CalendarEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendedEvents` ADD CONSTRAINT `_AttendedEvents_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
