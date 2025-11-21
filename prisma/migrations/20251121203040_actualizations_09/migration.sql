-- AlterTable
ALTER TABLE "enterprise_resources" ADD COLUMN     "filetype" TEXT;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "roadmapVisibleTo" "UserRole"[] DEFAULT ARRAY['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']::"UserRole"[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customPermissions" JSONB,
ADD COLUMN     "showInLeaderboard" BOOLEAN DEFAULT true;

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Lightbulb',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);
