-- CreateEnum
CREATE TABLE `SecurityLogEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SecurityLogEvent_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- InsertEnumValues
INSERT INTO `SecurityLogEvent` (`name`) VALUES
('SUCCESSFUL_LOGIN'),
('FAILED_LOGIN_ATTEMPT'),
('PASSWORD_CHANGE_SUCCESS'),
('TWO_FACTOR_ENABLED'),
('TWO_FACTOR_DISABLED'),
('USER_ROLE_CHANGED');

-- AlterTable
ALTER TABLE `Course` ADD COLUMN `publicationDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `pin` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `registeredDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('SUCCESSFUL_LOGIN', 'FAILED_LOGIN_ATTEMPT', 'PASSWORD_CHANGE_SUCCESS', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'USER_ROLE_CHANGED') NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `emailAttempt` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    INDEX `SecurityLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- UpdateData
UPDATE User SET registeredDate = createdAt WHERE registeredDate IS NULL;
ALTER TABLE CourseProgress MODIFY `completedLessonIds` JSON NOT NULL DEFAULT ('[]');
ALTER TABLE Resource MODIFY `tags` JSON NOT NULL DEFAULT ('[]');
ALTER TABLE Announcement MODIFY `audience` JSON NOT NULL;
ALTER TABLE PlatformSettings MODIFY `resourceCategories` JSON NOT NULL DEFAULT ('[\"Recursos Humanos\", \"TI y Seguridad\", \"Marketing\", \"Ventas\", \"Legal\", \"Operaciones\", \"Finanzas\", \"Formación Interna\", \"Documentación de Producto\", \"General\"]');
