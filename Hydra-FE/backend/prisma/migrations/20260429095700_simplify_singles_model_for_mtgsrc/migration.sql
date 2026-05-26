/*
  Warnings:

  - You are about to drop the column `hareruya_id` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `is_hareruya` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `discount_percentage` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `expansion` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `extendedArt` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `final_price` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `hareruya_link` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `is_new` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `is_on_sale` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `premier_play` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `prerelease` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `review_count` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the column `variant` on the `singles` table. All the data in the column will be lost.
  - You are about to drop the `order_items_hareruya` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price_mxn` to the `singles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_items_hareruya" DROP CONSTRAINT "order_items_hareruya_order_id_fkey";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "hareruya_id",
DROP COLUMN "is_hareruya",
ADD COLUMN     "importation_id" TEXT,
ADD COLUMN     "is_importation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "singles" DROP COLUMN "archived",
DROP COLUMN "description",
DROP COLUMN "discount_percentage",
DROP COLUMN "expansion",
DROP COLUMN "extendedArt",
DROP COLUMN "final_price",
DROP COLUMN "hareruya_link",
DROP COLUMN "images",
DROP COLUMN "is_new",
DROP COLUMN "is_on_sale",
DROP COLUMN "metadata",
DROP COLUMN "name",
DROP COLUMN "premier_play",
DROP COLUMN "prerelease",
DROP COLUMN "price",
DROP COLUMN "rating",
DROP COLUMN "review_count",
DROP COLUMN "variant",
ADD COLUMN     "expansion_code" TEXT,
ADD COLUMN     "extended_art" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_alternate_frame" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_prerelease" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_serialized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_showcase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "price_mxn" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "price_mxn_importation" DECIMAL(10,2),
ADD COLUMN     "price_mxn_local" DECIMAL(10,2),
ADD COLUMN     "raw_condition" TEXT,
ADD COLUMN     "set" TEXT;

-- DropTable
DROP TABLE "order_items_hareruya";

-- CreateTable
CREATE TABLE "order_items_importation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "importation_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "product_data" JSONB NOT NULL,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_quantity" INTEGER NOT NULL DEFAULT 0,
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "order_items_importation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_items_importation" ADD CONSTRAINT "order_items_importation_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
