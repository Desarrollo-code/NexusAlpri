-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "prerequisite_id" TEXT;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
