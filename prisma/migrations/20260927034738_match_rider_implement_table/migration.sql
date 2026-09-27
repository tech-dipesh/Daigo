/*
  Warnings:

  - A unique constraint covering the columns `[license_number]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,phone]` on the table `emergency_contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ride_request_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_ride_request_id_route_id_key" ON "matches"("ride_request_id", "route_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_license_number_key" ON "driver_documents"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_contacts_user_id_phone_key" ON "emergency_contacts"("user_id", "phone");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
