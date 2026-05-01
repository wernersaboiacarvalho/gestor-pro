-- AlterTable
ALTER TABLE "ServiceAttachment" ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL';
