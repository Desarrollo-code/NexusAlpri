-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "projectVersion" TEXT DEFAULT '1.0.0';
