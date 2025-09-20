-- CreateTable
CREATE TABLE "CyclicTaskAssignee" (
    "id" SERIAL NOT NULL,
    "cyclicTaskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyclicTaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CyclicTaskAssignee_cyclicTaskId_userId_key" ON "CyclicTaskAssignee"("cyclicTaskId", "userId");

-- AddForeignKey
ALTER TABLE "CyclicTaskAssignee" ADD CONSTRAINT "CyclicTaskAssignee_cyclicTaskId_fkey" FOREIGN KEY ("cyclicTaskId") REFERENCES "CyclicTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclicTaskAssignee" ADD CONSTRAINT "CyclicTaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
