-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CARRO', 'MOTO', 'CAMINHAO', 'OUTRO');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "category" "VehicleType" NOT NULL DEFAULT 'CARRO',
ADD COLUMN     "specifications" JSONB;
