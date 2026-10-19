-- CreateEnum
CREATE TYPE "AppealKind" AS ENUM ('WARNING', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WarningReason" AS ENUM ('GPS_SPOOF', 'CANCEL_GAMING', 'LATE_ARRIVAL', 'PRICE_OVER_CAP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'SUSPENSION';
ALTER TYPE "NotificationType" ADD VALUE 'APPEAL';

-- AlterEnum
ALTER TYPE "TripStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "ride_requests" ADD COLUMN     "allow_shared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "arrived_at" TIMESTAMP(3),
ADD COLUMN     "late_reported_at" TIMESTAMP(3),
ADD COLUMN     "no_show_reason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspended_from" TIMESTAMP(3),
ADD COLUMN     "suspended_until" TIMESTAMP(3),
ADD COLUMN     "suspension_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warnings_reset_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "appeals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "kind" "AppealKind" NOT NULL,
    "warning_id" UUID,
    "text" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "decided_by_id" UUID,
    "decision_note" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warnings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "reason" "WarningReason" NOT NULL,
    "note" TEXT,
    "trip_id" UUID,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appeals_status_created_at_idx" ON "appeals"("status", "created_at");

-- CreateIndex
CREATE INDEX "appeals_user_id_idx" ON "appeals"("user_id");

-- CreateIndex
CREATE INDEX "warnings_user_id_created_at_idx" ON "warnings"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_warning_id_fkey" FOREIGN KEY ("warning_id") REFERENCES "warnings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
