
-- CreateTable
CREATE TABLE `Analytics` (
    `id` VARCHAR(191) NOT NULL,
    `metric` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `value` INTEGER NOT NULL,
    `dimensions` JSON NULL,

    UNIQUE INDEX `Analytics_metric_date_key`(`metric`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
