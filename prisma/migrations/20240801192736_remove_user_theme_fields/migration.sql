/*
  Warnings:

  - You are about to drop the column `colorTheme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customThemeColors` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `colorTheme`,
    DROP COLUMN `customThemeColors`;
