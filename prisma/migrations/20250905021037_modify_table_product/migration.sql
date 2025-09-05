/*
  Warnings:

  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Product` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `Product` DROP PRIMARY KEY,
    DROP COLUMN `description`,
    DROP COLUMN `title`,
    ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `inputs` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `outputs` INTEGER NOT NULL DEFAULT 0,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` MODIFY `rol` VARCHAR(191) NOT NULL DEFAULT 'client';
