-- CreateEnum
CREATE TYPE "RecommendTag" AS ENUM ('GOOD_CONVERSATION', 'DRIVING_SKILL', 'PUNCTUAL', 'CLEAN_VEHICLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trust_score" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "rater_id" UUID NOT NULL,
    "rated_user_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "recommend_tag" "RecommendTag",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_trip_id_rater_id_key" ON "ratings"("trip_id", "rater_id");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
