-- AlterTable
ALTER TABLE "enterprise_resources" ADD COLUMN     "size" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_ProcessCourseAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProcessAnnouncementAudiences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProcessResourceShares" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProcessEventAudiences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProcessFormShares" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProcessCourseAssignments_AB_unique" ON "_ProcessCourseAssignments"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcessCourseAssignments_B_index" ON "_ProcessCourseAssignments"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProcessAnnouncementAudiences_AB_unique" ON "_ProcessAnnouncementAudiences"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcessAnnouncementAudiences_B_index" ON "_ProcessAnnouncementAudiences"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProcessResourceShares_AB_unique" ON "_ProcessResourceShares"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcessResourceShares_B_index" ON "_ProcessResourceShares"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProcessEventAudiences_AB_unique" ON "_ProcessEventAudiences"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcessEventAudiences_B_index" ON "_ProcessEventAudiences"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProcessFormShares_AB_unique" ON "_ProcessFormShares"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcessFormShares_B_index" ON "_ProcessFormShares"("B");

-- AddForeignKey
ALTER TABLE "_ProcessCourseAssignments" ADD CONSTRAINT "_ProcessCourseAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessCourseAssignments" ADD CONSTRAINT "_ProcessCourseAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessAnnouncementAudiences" ADD CONSTRAINT "_ProcessAnnouncementAudiences_A_fkey" FOREIGN KEY ("A") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessAnnouncementAudiences" ADD CONSTRAINT "_ProcessAnnouncementAudiences_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessResourceShares" ADD CONSTRAINT "_ProcessResourceShares_A_fkey" FOREIGN KEY ("A") REFERENCES "enterprise_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessResourceShares" ADD CONSTRAINT "_ProcessResourceShares_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessEventAudiences" ADD CONSTRAINT "_ProcessEventAudiences_A_fkey" FOREIGN KEY ("A") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessEventAudiences" ADD CONSTRAINT "_ProcessEventAudiences_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessFormShares" ADD CONSTRAINT "_ProcessFormShares_A_fkey" FOREIGN KEY ("A") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessFormShares" ADD CONSTRAINT "_ProcessFormShares_B_fkey" FOREIGN KEY ("B") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
