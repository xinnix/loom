/*
  Warnings:

  - You are about to drop the column `difyApiKey` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `difyApiUrl` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `difyAppType` on the `agents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agents" DROP COLUMN "difyApiKey",
DROP COLUMN "difyApiUrl",
DROP COLUMN "difyAppType",
ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "apiUrl" TEXT,
ADD COLUMN     "maxTokens" INTEGER,
ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'gpt-4o',
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "systemPrompt" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION;
