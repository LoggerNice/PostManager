/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `CyclicTask` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CyclicTask" DROP CONSTRAINT "CyclicTask_assigneeId_fkey";

-- AlterTable
ALTER TABLE "CyclicTask" DROP COLUMN "assigneeId";
