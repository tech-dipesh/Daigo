/*
  Warnings:

  - A unique constraint covering the columns `[share_token]` on the table `trips` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "is_deviated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_lat" DOUBLE PRECISION,
ADD COLUMN     "last_lng" DOUBLE PRECISION,
ADD COLUMN     "last_location_at" TIMESTAMP(3),
ADD COLUMN     "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "trips_share_token_key" ON "trips"("share_token");
