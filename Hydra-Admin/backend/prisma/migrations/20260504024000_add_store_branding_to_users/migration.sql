-- AlterTable
ALTER TABLE "users" ADD COLUMN "store_name" TEXT,
ADD COLUMN "rfc" TEXT,
ADD COLUMN "store_logo_url" TEXT,
ADD COLUMN "is_hydra_alias" BOOLEAN DEFAULT false;
