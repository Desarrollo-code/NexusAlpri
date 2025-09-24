/*
  Warnings:

  - Changed the type of `audience` on the `Announcement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "audience",
ADD COLUMN     "audience" TEXT NOT NULL;
