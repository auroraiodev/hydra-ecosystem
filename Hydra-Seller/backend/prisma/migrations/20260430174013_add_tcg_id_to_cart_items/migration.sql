-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "tcg_id" UUID;

-- CreateIndex
CREATE INDEX "cart_items_tcg_id_idx" ON "cart_items"("tcg_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_tcg_id_fkey" FOREIGN KEY ("tcg_id") REFERENCES "tcgs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
