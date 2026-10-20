/*
  Warnings:

  - The values [SUSPENSION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LATE_ARRIVAL] on the enum `WarningReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `late_reported_at` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_from` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_until` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspension_count` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `warnings_reset_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('MATCH_ACCEPTED', 'TRIP_STATUS', 'PAYMENT', 'VERIFICATION', 'WARNING', 'BAN', 'APPEAL');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WarningReason_new" AS ENUM ('GPS_SPOOF', 'CANCEL_GAMING', 'PRICE_OVER_CAP');
ALTER TABLE "warnings" ALTER COLUMN "reason" TYPE "WarningReason_new" USING ("reason"::text::"WarningReason_new");
ALTER TYPE "WarningReason" RENAME TO "WarningReason_old";
ALTER TYPE "WarningReason_new" RENAME TO "WarningReason";
DROP TYPE "public"."WarningReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "late_reported_at";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "suspended_from",
DROP COLUMN "suspended_until",
DROP COLUMN "suspension_count",
DROP COLUMN "warnings_reset_at",
ADD COLUMN     "warning_cycle_start" TIMESTAMP(3);
