/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_departmentId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "departmentId";

-- CreateTable
CREATE TABLE "_DepartmentToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DepartmentToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DepartmentToProject_B_index" ON "_DepartmentToProject"("B");

-- AddForeignKey
ALTER TABLE "_DepartmentToProject" ADD CONSTRAINT "_DepartmentToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToProject" ADD CONSTRAINT "_DepartmentToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
