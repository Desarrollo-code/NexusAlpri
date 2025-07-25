-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `isTwoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `publicationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,

    INDEX `courses_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    INDEX `modules_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,

    INDEX `lessons_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'VIDEO', 'QUIZ', 'FILE') NOT NULL,
    `content` TEXT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lessonId` VARCHAR(191) NOT NULL,

    INDEX `content_blocks_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizzes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contentBlockId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `quizzes_contentBlockId_key`(`contentBlockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE') NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quizId` VARCHAR(191) NOT NULL,

    INDEX `questions_quizId_idx`(`quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `answer_options` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `feedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `questionId` VARCHAR(191) NOT NULL,

    INDEX `answer_options_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    INDEX `enrollments_userId_idx`(`userId`),
    INDEX `enrollments_courseId_idx`(`courseId`),
    UNIQUE INDEX `enrollments_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_progress` (
    `id` VARCHAR(191) NOT NULL,
    `progressPercentage` DOUBLE NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `course_progress_enrollmentId_key`(`enrollmentId`),
    INDEX `course_progress_userId_courseId_idx`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_completion_records` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `score` DOUBLE NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progressId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `lesson_completion_records_progressId_lessonId_key`(`progressId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `audience` JSON NOT NULL,
    `priority` VARCHAR(191) NULL DEFAULT 'Normal',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,

    INDEX `announcements_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NULL,
    `audienceType` ENUM('ALL', 'ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC') NOT NULL DEFAULT 'ALL',
    `color` VARCHAR(191) NULL DEFAULT 'blue',
    `videoConferenceLink` VARCHAR(191) NULL,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    INDEX `calendar_events_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FOLDER', 'DOCUMENT', 'GUIDE', 'MANUAL', 'POLICY', 'VIDEO', 'EXTERNAL_LINK', 'OTHER') NOT NULL DEFAULT 'DOCUMENT',
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `tags` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,

    INDEX `resources_uploaderId_idx`(`uploaderId`),
    INDEX `resources_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_settings` (
    `id` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'NexusAlpri',
    `allowPublicRegistration` BOOLEAN NOT NULL DEFAULT true,
    `enableEmailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `emailWhitelist` TEXT NULL,
    `resourceCategories` TEXT NOT NULL DEFAULT 'Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General',
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireUppercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireLowercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireNumber` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireSpecialChar` BOOLEAN NOT NULL DEFAULT true,
    `enableIdleTimeout` BOOLEAN NOT NULL DEFAULT true,
    `idleTimeoutMinutes` INTEGER NOT NULL DEFAULT 20,
    `require2faForAdmins` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_logs` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('SUCCESSFUL_LOGIN', 'FAILED_LOGIN_ATTEMPT', 'PASSWORD_CHANGE_SUCCESS', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'USER_ROLE_CHANGED') NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,
    `emailAttempt` VARCHAR(191) NULL,

    INDEX `security_logs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('SYSTEM', 'USER') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NULL,

    INDEX `lesson_templates_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'VIDEO', 'QUIZ', 'FILE') NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,

    INDEX `template_blocks_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventAttendees` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EventAttendees_AB_unique`(`A`, `B`),
    INDEX `_EventAttendees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
