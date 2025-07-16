-- AlterTable
ALTER TABLE `User` ADD COLUMN `colorTheme` VARCHAR(191) NULL,
    ADD COLUMN `customThemeColors` JSON NULL;
