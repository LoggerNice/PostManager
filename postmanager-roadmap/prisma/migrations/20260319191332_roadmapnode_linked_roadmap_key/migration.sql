-- AlterTable
ALTER TABLE "RoadmapNode" ADD COLUMN     "linkedRoadmapKey" TEXT;

-- CreateIndex
CREATE INDEX "RoadmapNode_linkedRoadmapKey_idx" ON "RoadmapNode"("linkedRoadmapKey");

-- AddForeignKey
ALTER TABLE "RoadmapNode" ADD CONSTRAINT "RoadmapNode_linkedRoadmapKey_fkey" FOREIGN KEY ("linkedRoadmapKey") REFERENCES "Roadmap"("key") ON DELETE SET NULL ON UPDATE CASCADE;
