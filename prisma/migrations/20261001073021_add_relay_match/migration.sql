-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "RelayLegStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RelayMatchStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RelayLeg" AS ENUM ('FIRST', 'SECOND');

-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_match_id_fkey";

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "relay_leg" "RelayLeg",
ADD COLUMN     "relay_match_id" UUID,
ALTER COLUMN "match_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "relay_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ride_request_id" UUID NOT NULL,
    "first_route_id" UUID NOT NULL,
    "second_route_id" UUID NOT NULL,
    "transfer_lat" DOUBLE PRECISION NOT NULL,
    "transfer_lng" DOUBLE PRECISION NOT NULL,
    "price_estimate" INTEGER NOT NULL,
    "first_leg_status" "RelayLegStatus" NOT NULL DEFAULT 'PENDING',
    "second_leg_status" "RelayLegStatus" NOT NULL DEFAULT 'PENDING',
    "status" "RelayMatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relay_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "relay_matches_ride_request_id_first_route_id_second_route_i_key" ON "relay_matches"("ride_request_id", "first_route_id", "second_route_id");

-- AddForeignKey
ALTER TABLE "relay_matches" ADD CONSTRAINT "relay_matches_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_matches" ADD CONSTRAINT "relay_matches_first_route_id_fkey" FOREIGN KEY ("first_route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_matches" ADD CONSTRAINT "relay_matches_second_route_id_fkey" FOREIGN KEY ("second_route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_relay_match_id_fkey" FOREIGN KEY ("relay_match_id") REFERENCES "relay_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
