/*
  Warnings:

  - Added the required column `payment_id_paypal` to the `Auditoria` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Auditoria` ADD COLUMN `payment_id_paypal` VARCHAR(191) NOT NULL;
