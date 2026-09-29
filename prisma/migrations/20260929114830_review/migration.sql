-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('MODERATOR', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "driver_documents" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "staff_role" "StaffRole";

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3);
