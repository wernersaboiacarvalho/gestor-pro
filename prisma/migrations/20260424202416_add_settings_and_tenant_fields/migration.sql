/*
  Warnings:

  - Added the required column `updatedAt` to the `Setting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "lowStockAlert" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "modulesEnabled" JSONB,
ADD COLUMN     "passwordMinLength" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "serviceCompletedAlert" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sessionTimeout" INTEGER NOT NULL DEFAULT 480,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light',
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "primaryColor" SET DEFAULT '#3b82f6';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;
