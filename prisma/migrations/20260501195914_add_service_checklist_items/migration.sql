-- CreateTable
CREATE TABLE "ServiceChecklistItem" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdById" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceChecklistItem_serviceId_idx" ON "ServiceChecklistItem"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceChecklistItem_tenantId_idx" ON "ServiceChecklistItem"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceChecklistItem_completed_idx" ON "ServiceChecklistItem"("completed");

-- AddForeignKey
ALTER TABLE "ServiceChecklistItem" ADD CONSTRAINT "ServiceChecklistItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
