-- CreateEnum
CREATE TYPE "OfferParty" AS ENUM ('RIDER', 'DRIVER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'OFFER';

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "auto_accept" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auto_min_per_km" DOUBLE PRECISION,
ADD COLUMN     "auto_min_price" INTEGER,
ADD COLUMN     "auto_min_trust" INTEGER;

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "by" "OfferParty" NOT NULL,
    "price" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_match_id_round_key" ON "offers"("match_id", "round");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
