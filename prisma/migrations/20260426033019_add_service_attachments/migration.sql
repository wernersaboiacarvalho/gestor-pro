-- CreateTable
CREATE TABLE "ServiceAttachment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceAttachment_serviceId_idx" ON "ServiceAttachment"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceAttachment_tenantId_idx" ON "ServiceAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceAttachment_createdAt_idx" ON "ServiceAttachment"("createdAt");

-- AddForeignKey
ALTER TABLE "ServiceAttachment" ADD CONSTRAINT "ServiceAttachment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
