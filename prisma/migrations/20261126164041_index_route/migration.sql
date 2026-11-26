-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "from_geog" geography(Point,4326),
ADD COLUMN     "to_geog" geography(Point,4326);

-- CreateIndex
CREATE INDEX "routes_from_geog_idx" ON "routes" USING GIST ("from_geog");

-- CreateIndex
CREATE INDEX "routes_to_geog_idx" ON "routes" USING GIST ("to_geog");
