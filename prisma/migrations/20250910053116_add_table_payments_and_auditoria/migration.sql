-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `ordersId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `payment_method` JSON NULL,
    `invoice_id` VARCHAR(191) NOT NULL,
    `preference_id` VARCHAR(191) NULL,
    `payment_id_paypal` VARCHAR(191) NOT NULL,
    `payer` JSON NULL,
    `date_created` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_invoice_id_key`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_id` VARCHAR(191) NOT NULL,
    `response_created_preference` JSON NULL,
    `resquested_webhook` JSON NULL,
    `response_get_payment` JSON NULL,
    `external_reference` VARCHAR(191) NOT NULL,
    `info_return_payment` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Auditoria_payment_id_key`(`payment_id`),
    UNIQUE INDEX `Auditoria_external_reference_key`(`external_reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_ordersId_fkey` FOREIGN KEY (`ordersId`) REFERENCES `Orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
