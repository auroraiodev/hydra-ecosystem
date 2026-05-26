-- Add is_local_inventory column to singles table
ALTER TABLE "singles" ADD COLUMN IF NOT EXISTS "is_local_inventory" BOOLEAN NOT NULL DEFAULT false;
