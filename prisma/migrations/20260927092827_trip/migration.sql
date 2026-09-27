/*
  Warnings:

  - You are about to drop the column `distance_km` on the `matches` table. All the data in the column will be lost.
  - Added the required column `detour_distance_km` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_estimate` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PENDING_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripParty" AS ENUM ('RIDER', 'DRIVER');

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "distance_km",
ADD COLUMN     "detour_distance_km" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "price_estimate" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "ride_request_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "price_estimate" INTEGER NOT NULL,
    "pickup_otp" TEXT NOT NULL,
    "otp_verified_at" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "cancelled_by" "TripParty",
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trips_match_id_key" ON "trips"("match_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
