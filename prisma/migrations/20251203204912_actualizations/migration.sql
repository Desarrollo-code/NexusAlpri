/*
  Warnings:

  - You are about to drop the column `ispublic` on the `enterprise_resources` table. All the data in the column will be lost.
  - You are about to drop the `_ProcessResourceShares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SharedWithUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ResourceSharingMode" AS ENUM ('PUBLIC', 'PRIVATE', 'PROCESS');

-- DropForeignKey
ALTER TABLE "_ProcessResourceShares" DROP CONSTRAINT "_ProcessResourceShares_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProcessResourceShares" DROP CONSTRAINT "_ProcessResourceShares_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedWithUsers" DROP CONSTRAINT "_SharedWithUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedWithUsers" DROP CONSTRAINT "_SharedWithUsers_B_fkey";

-- AlterTable
ALTER TABLE "enterprise_resources" DROP COLUMN "ispublic",
ADD COLUMN     "sharingMode" "ResourceSharingMode" NOT NULL DEFAULT 'PUBLIC';

-- DropTable
DROP TABLE "_ProcessResourceShares";

-- DropTable
DROP TABLE "_SharedWithUsers";

-- CreateTable
CREATE TABLE "_ResourceSharedWith" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ResourceSharedWithProcess" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ResourceSharedWith_AB_unique" ON "_ResourceSharedWith"("A", "B");

-- CreateIndex
CREATE INDEX "_ResourceSharedWith_B_index" ON "_ResourceSharedWith"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ResourceSharedWithProcess_AB_unique" ON "_ResourceSharedWithProcess"("A", "B");

-- CreateIndex
CREATE INDEX "_ResourceSharedWithProcess_B_index" ON "_ResourceSharedWithProcess"("B");

-- AddForeignKey
ALTER TABLE "_ResourceSharedWith" ADD CONSTRAINT "_ResourceSharedWith_A_fkey" FOREIGN KEY ("A") REFERENCES "enterprise_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceSharedWith" ADD CONSTRAINT "_ResourceSharedWith_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceSharedWithProcess" ADD CONSTRAINT "_ResourceSharedWithProcess_A_fkey" FOREIGN KEY ("A") REFERENCES "enterprise_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceSharedWithProcess" ADD CONSTRAINT "_ResourceSharedWithProcess_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
