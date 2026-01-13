-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "motivationalMessageId" TEXT;

-- AlterTable
ALTER TABLE "template_blocks" ADD COLUMN     "content" TEXT;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_motivationalMessageId_fkey" FOREIGN KEY ("motivationalMessageId") REFERENCES "MotivationalMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
