/*
  Warnings:

  - Added the required column `initialInputs` to the `execution_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "execution_data" ADD COLUMN     "initialInputs" JSONB NOT NULL;
