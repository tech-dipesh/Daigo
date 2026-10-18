-- CreateTable
CREATE TABLE "fare_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_type" "VehicleType" NOT NULL,
    "per_km" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "min_lat" DOUBLE PRECISION NOT NULL,
    "max_lat" DOUBLE PRECISION NOT NULL,
    "min_lng" DOUBLE PRECISION NOT NULL,
    "max_lng" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fare_rates_vehicle_type_key" ON "fare_rates"("vehicle_type");

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");
