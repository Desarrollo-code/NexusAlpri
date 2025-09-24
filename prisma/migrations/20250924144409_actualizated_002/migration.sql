/*
  Warnings:

  - The `audience` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "audience",
ADD COLUMN     "audience" "EventAudienceType" NOT NULL DEFAULT 'ALL';
