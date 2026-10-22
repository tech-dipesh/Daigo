-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'WAITLIST';
ALTER TYPE "NotificationType" ADD VALUE 'SAVINGS';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "distance_km" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "distance_km" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "waitlists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_request_id_key" ON "waitlists"("request_id");

-- CreateIndex
CREATE INDEX "waitlists_status_expires_at_idx" ON "waitlists"("status", "expires_at");
