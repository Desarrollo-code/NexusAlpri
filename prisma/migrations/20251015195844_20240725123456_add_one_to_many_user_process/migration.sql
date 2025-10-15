/*
  Warnings:

  - You are about to drop the `_UserProcesses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserProcesses" DROP CONSTRAINT "_UserProcesses_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserProcesses" DROP CONSTRAINT "_UserProcesses_B_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "processId" TEXT;

-- DropTable
DROP TABLE "_UserProcesses";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;
