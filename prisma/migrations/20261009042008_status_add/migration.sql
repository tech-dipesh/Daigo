-- CreateEnum
CREATE TYPE "OpenEvent" AS ENUM ('OPEN', 'CLOSE');

-- AlterTable
ALTER TABLE "emergency_events" ADD COLUMN     "status" "OpenEvent" NOT NULL DEFAULT 'OPEN';
