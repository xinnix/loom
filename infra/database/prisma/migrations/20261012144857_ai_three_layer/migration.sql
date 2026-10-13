/*
  Warnings:

  - You are about to drop the column `apiKey` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `apiUrl` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `systemPrompt` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `agents` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "agents_slug_idx";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "apiKey",
DROP COLUMN "apiUrl",
DROP COLUMN "maxTokens",
DROP COLUMN "model",
DROP COLUMN "provider",
DROP COLUMN "systemPrompt",
DROP COLUMN "temperature",
ADD COLUMN     "llmConfigId" TEXT,
ADD COLUMN     "tools" JSONB;

-- CreateTable
CREATE TABLE "llm_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "apiUrl" TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
    "apiKeyEnc" TEXT NOT NULL,
    "apiKeyMask" TEXT,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
    "maxRetries" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "agentSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" JSONB NOT NULL,
    "output" TEXT,
    "error" TEXT,
    "nodeTrace" JSONB,
    "usage" JSONB,
    "durationMs" INTEGER,
    "triggeredById" TEXT,
    "triggeredByType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "llm_configs_configKey_key" ON "llm_configs"("configKey");

-- CreateIndex
CREATE INDEX "agent_runs_agentSlug_createdAt_idx" ON "agent_runs"("agentSlug", "createdAt");

-- CreateIndex
CREATE INDEX "agent_runs_status_idx" ON "agent_runs"("status");

-- AddForeignKey
ALTER TABLE "llm_configs" ADD CONSTRAINT "llm_configs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_configs" ADD CONSTRAINT "llm_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_llmConfigId_fkey" FOREIGN KEY ("llmConfigId") REFERENCES "llm_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
