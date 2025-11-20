/*
  Warnings:

  - A unique constraint covering the columns `[resourceId]` on the table `quizzes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "certificate_templates" ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "footerTextPosition" JSONB DEFAULT '{"x":50,"y":90,"fontSize":14,"fontWeight":"normal","textAlign":"center"}',
ADD COLUMN     "logoPosition" JSONB DEFAULT '{"x":5,"y":5,"width":20,"height":15}',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "watermarkOpacity" DOUBLE PRECISION DEFAULT 0.1,
ADD COLUMN     "watermarkUrl" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "remedialContent" TEXT,
ADD COLUMN     "resourceId" TEXT;

-- CreateTable
CREATE TABLE "CourseComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "CommentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_resourceId_key" ON "quizzes"("resourceId");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "enterprise_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseComment" ADD CONSTRAINT "CourseComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseComment" ADD CONSTRAINT "CourseComment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAttachment" ADD CONSTRAINT "CommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CourseComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
