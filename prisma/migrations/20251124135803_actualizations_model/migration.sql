-- AlterTable
ALTER TABLE "enterprise_resources" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "roadmapPhases" TEXT[] DEFAULT ARRAY[]::TEXT[];
