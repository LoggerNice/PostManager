-- CreateTable
CREATE TABLE "TaskGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "groupId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalTasks" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "incorrectAnswers" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskGroup_name_key" ON "TaskGroup"("name");

-- CreateIndex
CREATE INDEX "Mission_groupId_idx" ON "Mission"("groupId");

-- CreateIndex
CREATE INDEX "TrainingResult_userId_idx" ON "TrainingResult"("userId");

-- CreateIndex
CREATE INDEX "TrainingResult_sessionId_idx" ON "TrainingResult"("sessionId");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TaskGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingResult" ADD CONSTRAINT "TrainingResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
