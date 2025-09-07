/*
  Warnings:

  - Made the column `brand` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Product` MODIFY `brand` VARCHAR(191) NOT NULL DEFAULT 'generic',
    MODIFY `name` VARCHAR(191) NOT NULL;
