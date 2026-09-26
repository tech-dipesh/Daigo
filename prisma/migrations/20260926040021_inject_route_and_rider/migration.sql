-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('REGULAR', 'ADVANCE');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rider_id" UUID NOT NULL,
    "from_label" TEXT NOT NULL,
    "from_lat" DOUBLE PRECISION NOT NULL,
    "from_lng" DOUBLE PRECISION NOT NULL,
    "to_label" TEXT NOT NULL,
    "to_lat" DOUBLE PRECISION NOT NULL,
    "to_lng" DOUBLE PRECISION NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "group_size" INTEGER NOT NULL DEFAULT 1,
    "has_luggage" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "is_vulnerable" BOOLEAN NOT NULL DEFAULT false,
    "women_only" BOOLEAN NOT NULL DEFAULT false,
    "ac_only" BOOLEAN NOT NULL DEFAULT false,
    "vehicle_preference" "VehicleType",
    "status" "RideRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "route_type" "RouteType" NOT NULL,
    "from_label" TEXT NOT NULL,
    "from_lat" DOUBLE PRECISION NOT NULL,
    "from_lng" DOUBLE PRECISION NOT NULL,
    "to_label" TEXT NOT NULL,
    "to_lat" DOUBLE PRECISION NOT NULL,
    "to_lng" DOUBLE PRECISION NOT NULL,
    "days_of_week" INTEGER[],
    "departure_date" TIMESTAMP(3),
    "departure_time" TIME NOT NULL,
    "detour_limit_km" DOUBLE PRECISION NOT NULL,
    "seats_available" INTEGER NOT NULL,
    "status" "RouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
