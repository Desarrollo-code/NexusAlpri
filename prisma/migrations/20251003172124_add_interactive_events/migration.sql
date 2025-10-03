-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "isInteractive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "interactiveEventId" TEXT,
ADD COLUMN     "interactiveEventOccurrence" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "event_participations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_userId_eventId_occurrenceDate_key" ON "event_participations"("userId", "eventId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
