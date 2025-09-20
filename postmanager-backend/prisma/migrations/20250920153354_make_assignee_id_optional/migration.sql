-- DropForeignKey
ALTER TABLE "CyclicTask" DROP CONSTRAINT "CyclicTask_assigneeId_fkey";

-- AlterTable
ALTER TABLE "CyclicTask" ALTER COLUMN "assigneeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CyclicTask" ADD CONSTRAINT "CyclicTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
