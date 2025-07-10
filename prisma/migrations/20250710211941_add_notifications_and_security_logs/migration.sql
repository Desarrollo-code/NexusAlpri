/*
  Warnings:

  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_eventattendees` DROP FOREIGN KEY `_EventAttendees_A_fkey`;

-- DropForeignKey
ALTER TABLE `_eventattendees` DROP FOREIGN KEY `_EventAttendees_B_fkey`;

-- DropForeignKey
ALTER TABLE `announcements` DROP FOREIGN KEY `announcements_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_options` DROP FOREIGN KEY `answer_options_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `calendar_events` DROP FOREIGN KEY `calendar_events_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `content_blocks` DROP FOREIGN KEY `content_blocks_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `course_progress` DROP FOREIGN KEY `course_progress_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `course_progress` DROP FOREIGN KEY `course_progress_userId_fkey`;

-- DropForeignKey
ALTER TABLE `courses` DROP FOREIGN KEY `courses_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_userId_fkey`;

-- DropForeignKey
ALTER TABLE `lessons` DROP FOREIGN KEY `lessons_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `modules` DROP FOREIGN KEY `modules_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `questions` DROP FOREIGN KEY `questions_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_contentBlockId_fkey`;

-- DropForeignKey
ALTER TABLE `resources` DROP FOREIGN KEY `resources_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `resources` DROP FOREIGN KEY `resources_uploaderId_fkey`;

-- DropTable
DROP TABLE `announcements`;

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
DROP TABLE `quizzes`;

-- DropTable
DROP TABLE `resources`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` TEXT NULL,
    `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isTwoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` TEXT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `publicationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,

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
    `type` VARCHAR(191) NULL,

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
    `contentBlockId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Quiz_contentBlockId_key`(`contentBlockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE') NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    `order` INTEGER NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerOption` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `feedback` TEXT NULL,
    `questionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseProgress` (
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `completedLessonIds` JSON NOT NULL,
    `progressPercentage` DOUBLE NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,

    PRIMARY KEY (`userId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `platformName` VARCHAR(191) NOT NULL,
    `allowPublicRegistration` BOOLEAN NOT NULL DEFAULT true,
    `enableEmailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `require2faForAdmins` BOOLEAN NOT NULL DEFAULT false,
    `idleTimeoutMinutes` INTEGER NOT NULL DEFAULT 20,
    `enableIdleTimeout` BOOLEAN NOT NULL DEFAULT true,
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireUppercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireLowercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireNumber` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true,
    `resourceCategories` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'OTHER') NOT NULL,
    `url` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,
    `pin` TEXT NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploaderId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `audience` JSON NOT NULL,
    `priority` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

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
    `audienceType` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('FAILED_LOGIN_ATTEMPT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS') NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `emailAttempt` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_A_fkey` FOREIGN KEY (`A`) REFERENCES `CalendarEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventAttendees` ADD CONSTRAINT `_EventAttendees_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
