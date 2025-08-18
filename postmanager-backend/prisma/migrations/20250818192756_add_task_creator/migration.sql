/*
  Warnings:

  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- Сначала добавляем колонку с дефолтным значением
ALTER TABLE "Task" ADD COLUMN "creatorId" INTEGER;

-- Устанавливаем дефолтное значение для существующих записей (ID первого пользователя)
UPDATE "Task" SET "creatorId" = (SELECT id FROM "User" LIMIT 1);

-- Делаем колонку обязательной
ALTER TABLE "Task" ALTER COLUMN "creatorId" SET NOT NULL;

-- Добавляем внешний ключ
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
