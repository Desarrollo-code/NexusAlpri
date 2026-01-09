-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "messageId" TEXT;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MotivationalMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
