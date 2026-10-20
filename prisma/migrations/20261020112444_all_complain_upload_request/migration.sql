/*
  Warnings:

  - You are about to drop the column `license_photo_url` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `rc_photo_url` on the `vehicles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('PAYMENT', 'ROUTE', 'RATING', 'CONDUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadKind" AS ENUM ('LICENCE', 'RC', 'PAYMENT_PROOF', 'PROFILE_PHOTO');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'DELETED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMPLAINT';

-- AlterTable
ALTER TABLE "driver_documents" DROP COLUMN "license_photo_url",
ADD COLUMN     "license_upload_id" UUID;

-- AlterTable
ALTER TABLE "ride_requests" ADD COLUMN     "minor_age" INTEGER,
ADD COLUMN     "minor_name" TEXT;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "rc_photo_url",
ADD COLUMN     "rc_upload_id" UUID;

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "filed_by_id" UUID NOT NULL,
    "against_id" UUID NOT NULL,
    "type" "ComplaintType" NOT NULL,
    "text" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "admin_note" TEXT,
    "handled_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "kind" "UploadKind" NOT NULL,
    "key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "complaints_status_created_at_idx" ON "complaints"("status", "created_at");

-- CreateIndex
CREATE INDEX "complaints_trip_id_idx" ON "complaints"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_key_key" ON "uploads"("key");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "uploads"("user_id");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_filed_by_id_fkey" FOREIGN KEY ("filed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
