-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "ride_requests" ADD COLUMN     "passenger_email" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payment_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "from_label" TEXT NOT NULL,
    "from_lat" DOUBLE PRECISION NOT NULL,
    "from_lng" DOUBLE PRECISION NOT NULL,
    "to_label" TEXT NOT NULL,
    "to_lat" DOUBLE PRECISION NOT NULL,
    "to_lng" DOUBLE PRECISION NOT NULL,
    "group_size" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_shares_email_status_idx" ON "payment_shares"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_shares_payment_id_email_key" ON "payment_shares"("payment_id", "email");

-- CreateIndex
CREATE INDEX "saved_routes_user_id_idx" ON "saved_routes"("user_id");

-- AddForeignKey
ALTER TABLE "payment_shares" ADD CONSTRAINT "payment_shares_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_routes" ADD CONSTRAINT "saved_routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
