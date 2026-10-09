/*
  Warnings:

  - The `status` column on the `emergency_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('OPEN', 'RESOLVED');

-- DropIndex
DROP INDEX "emergency_events_trip_id_key";

-- AlterTable
ALTER TABLE "emergency_events" ADD COLUMN     "resolved_at" TIMESTAMPTZ,
ALTER COLUMN "trip_id" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
DROP COLUMN "status",
ADD COLUMN     "status" "EmergencyStatus" NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "OpenEvent";

-- AddForeignKey
ALTER TABLE "emergency_events" ADD CONSTRAINT "emergency_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
