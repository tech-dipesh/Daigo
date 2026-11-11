/*
  Warnings:

  - The values [LATE_ARRIVAl] on the enum `WarningReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WarningReason_new" AS ENUM ('GPS_SPOOF', 'CANCEL_GAMING', 'PRICE_OVER_CAP');
ALTER TABLE "warnings" ALTER COLUMN "reason" TYPE "WarningReason_new" USING ("reason"::text::"WarningReason_new");
ALTER TYPE "WarningReason" RENAME TO "WarningReason_old";
ALTER TYPE "WarningReason_new" RENAME TO "WarningReason";
DROP TYPE "public"."WarningReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "from_geog" geography(Point,4326),
ADD COLUMN     "to_geog" geography(Point,4326);

-- CreateIndex
CREATE INDEX "routes_from_geog_idx" ON "routes" USING GIST ("from_geog");

-- CreateIndex
CREATE INDEX "routes_to_geog_idx" ON "routes" USING GIST ("to_geog");
