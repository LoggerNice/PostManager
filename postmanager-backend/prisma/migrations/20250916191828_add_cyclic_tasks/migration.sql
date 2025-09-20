-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "CyclicTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "deadline" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "assigneeId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyclicTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CyclicTask_dayOfWeek_idx" ON "CyclicTask"("dayOfWeek");

-- CreateIndex
CREATE INDEX "CyclicTask_isActive_idx" ON "CyclicTask"("isActive");

-- AddForeignKey
ALTER TABLE "CyclicTask" ADD CONSTRAINT "CyclicTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclicTask" ADD CONSTRAINT "CyclicTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclicTask" ADD CONSTRAINT "CyclicTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
