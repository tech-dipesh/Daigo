/*
  Warnings:

  - You are about to drop the column `from_geog` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `to_geog` on the `routes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('trips', 'users', 'complaints');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('QUEUED', 'RUNNING', 'READY', 'FAILED');

-- DropIndex
DROP INDEX "routes_from_geog_idx";

-- DropIndex
DROP INDEX "routes_to_geog_idx";

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "from_geog",
DROP COLUMN "to_geog";

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ExportType" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'QUEUED',
    "range_from" TIMESTAMPTZ(3) NOT NULL,
    "range_to" TIMESTAMPTZ(3) NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "file_key" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_jobs_created_at_idx" ON "export_jobs"("created_at");
