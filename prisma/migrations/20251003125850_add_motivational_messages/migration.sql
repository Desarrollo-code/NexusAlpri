-- CreateEnum
CREATE TYPE "MotivationalMessageTriggerType" AS ENUM ('COURSE_COMPLETION', 'LEVEL_UP');

-- CreateTable
CREATE TABLE "MotivationalMessage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "triggerType" "MotivationalMessageTriggerType" NOT NULL,
    "triggerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotivationalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MotivationalMessage_triggerType_triggerId_key" ON "MotivationalMessage"("triggerType", "triggerId");

-- AddForeignKey
ALTER TABLE "MotivationalMessage" ADD CONSTRAINT "MotivationalMessage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
