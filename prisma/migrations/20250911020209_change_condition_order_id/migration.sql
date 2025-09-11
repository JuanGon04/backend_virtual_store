/*
  Warnings:

  - You are about to drop the column `preference_id` on the `Payment` table. All the data in the column will be lost.
  - Made the column `ordersId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_ordersId_fkey`;

-- DropIndex
DROP INDEX `Payment_ordersId_fkey` ON `Payment`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `preference_id`,
    MODIFY `ordersId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_ordersId_fkey` FOREIGN KEY (`ordersId`) REFERENCES `Orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
