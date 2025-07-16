-- AlterTable
ALTER TABLE `users` ADD COLUMN `colorTheme` VARCHAR(191) NULL DEFAULT 'corporate-blue',
    ADD COLUMN `customThemeColors` JSON NULL;
