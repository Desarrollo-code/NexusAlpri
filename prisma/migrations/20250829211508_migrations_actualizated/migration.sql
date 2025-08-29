-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `avatar` VARCHAR(191) NULL,
    `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isTwoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `theme` VARCHAR(191) NULL,
    `xp` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `publicationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,

    INDEX `Course_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Module` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    INDEX `Module_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,

    INDEX `Lesson_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentBlock` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'VIDEO', 'QUIZ', 'FILE') NOT NULL,
    `content` TEXT NULL,
    `order` INTEGER NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,

    INDEX `ContentBlock_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `maxAttempts` INTEGER NULL,
    `contentBlockId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Quiz_contentBlockId_key`(`contentBlockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `order` INTEGER NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,

    INDEX `Question_quizId_idx`(`quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerOption` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `feedback` TEXT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `questionId` VARCHAR(191) NOT NULL,

    INDEX `AnswerOption_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Enrollment_userId_idx`(`userId`),
    INDEX `Enrollment_courseId_idx`(`courseId`),
    UNIQUE INDEX `Enrollment_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `progressPercentage` DOUBLE NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `enrollmentId` VARCHAR(191) NULL,

    UNIQUE INDEX `CourseProgress_enrollmentId_key`(`enrollmentId`),
    INDEX `CourseProgress_userId_idx`(`userId`),
    INDEX `CourseProgress_courseId_idx`(`courseId`),
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
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LessonCompletionRecord_progressId_lessonId_key`(`progressId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuizAttempt_userId_quizId_idx`(`userId`, `quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `quizAttemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selectedOptionId` VARCHAR(191) NOT NULL,

    INDEX `AnswerAttempt_quizAttemptId_idx`(`quizAttemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `authorId` VARCHAR(191) NOT NULL,
    `audience` JSON NOT NULL,
    `priority` VARCHAR(191) NULL,

    INDEX `Announcement_authorId_idx`(`authorId`),
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
    `creatorId` VARCHAR(191) NOT NULL,
    `audienceType` ENUM('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC') NOT NULL DEFAULT 'ALL',
    `color` VARCHAR(191) NULL,
    `videoConferenceLink` VARCHAR(191) NULL,
    `attachments` JSON NULL,

    INDEX `CalendarEvent_creatorId_idx`(`creatorId`),
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

    INDEX `Notification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNote` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'yellow',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserNote_userId_lessonId_key`(`userId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'EXTERNAL_LINK', 'OTHER') NOT NULL,
    `url` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploaderId` VARCHAR(191) NULL,
    `pin` VARCHAR(191) NULL,
    `ispublic` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,

    INDEX `Resource_uploaderId_idx`(`uploaderId`),
    INDEX `Resource_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'NexusAlpri',
    `allowPublicRegistration` BOOLEAN NOT NULL DEFAULT true,
    `enableEmailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `emailWhitelist` VARCHAR(191) NULL,
    `resourceCategories` TEXT NULL,
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireUppercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireLowercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireNumber` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true,
    `enableIdleTimeout` BOOLEAN NOT NULL DEFAULT true,
    `idleTimeoutMinutes` INTEGER NOT NULL DEFAULT 20,
    `require2faForAdmins` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,
    `primaryColor` VARCHAR(191) NULL DEFAULT '#6366f1',
    `secondaryColor` VARCHAR(191) NULL DEFAULT '#a5b4fc',
    `accentColor` VARCHAR(191) NULL DEFAULT '#ec4899',
    `backgroundColorLight` VARCHAR(191) NULL DEFAULT '#f8fafc',
    `primaryColorDark` VARCHAR(191) NULL DEFAULT '#a5b4fc',
    `backgroundColorDark` VARCHAR(191) NULL DEFAULT '#020617',
    `fontHeadline` VARCHAR(191) NULL DEFAULT 'Space Grotesk',
    `fontBody` VARCHAR(191) NULL DEFAULT 'Inter',
    `logoUrl` VARCHAR(191) NULL,
    `watermarkUrl` VARCHAR(191) NULL,
    `landingImageUrl` VARCHAR(191) NULL,
    `authImageUrl` VARCHAR(191) NULL,
    `aboutImageUrl` VARCHAR(191) NULL,
    `benefitsImageUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('SUCCESSFUL_LOGIN', 'FAILED_LOGIN_ATTEMPT', 'PASSWORD_CHANGE_SUCCESS', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'USER_ROLE_CHANGED') NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,
    `emailAttempt` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,

    INDEX `SecurityLog_userId_idx`(`userId`),
    INDEX `SecurityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` VARCHAR(191) NOT NULL,
    `slug` ENUM('FIRST_ENROLLMENT', 'FIRST_COURSE_COMPLETED', 'PERFECT_QUIZ_SCORE', 'FIVE_COURSES_COMPLETED') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL,

    UNIQUE INDEX `Achievement_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAchievement` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserAchievement_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('SYSTEM', 'USER') NOT NULL,
    `creatorId` VARCHAR(191) NULL,

    INDEX `LessonTemplate_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemplateBlock` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'VIDEO', 'QUIZ', 'FILE') NOT NULL,
    `order` INTEGER NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,

    INDEX `TemplateBlock_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Form` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isQuiz` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    INDEX `Form_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormField` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `placeholder` VARCHAR(191) NULL,
    `options` JSON NULL,
    `order` INTEGER NOT NULL,
    `formId` VARCHAR(191) NOT NULL,

    INDEX `FormField_formId_idx`(`formId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormResponse` (
    `id` VARCHAR(191) NOT NULL,
    `formId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `score` DOUBLE NULL,

    INDEX `FormResponse_formId_idx`(`formId`),
    INDEX `FormResponse_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `responseId` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    INDEX `FormAnswer_responseId_idx`(`responseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_LessonToTemplate` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_LessonToTemplate_AB_unique`(`A`, `B`),
    INDEX `_LessonToTemplate_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AttendedEvents` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AttendedEvents_AB_unique`(`A`, `B`),
    INDEX `_AttendedEvents_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SharedResources` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_SharedResources_AB_unique`(`A`, `B`),
    INDEX `_SharedResources_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SharedForms` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_SharedForms_AB_unique`(`A`, `B`),
    INDEX `_SharedForms_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
