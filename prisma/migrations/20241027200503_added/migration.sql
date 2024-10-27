/*
  Warnings:

  - Added the required column `note` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `note` VARCHAR(191) NOT NULL,
    ADD COLUMN `transactionId` VARCHAR(191) NOT NULL;
