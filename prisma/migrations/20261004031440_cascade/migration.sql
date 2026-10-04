-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_owner_id_fkey";

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
