-- AlterTable
ALTER TABLE "llm_configs" ADD COLUMN     "inputPricePer1M" DOUBLE PRECISION,
ADD COLUMN     "outputPricePer1M" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "llm_call_logs" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "sceneKey" TEXT,
    "callType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "llmConfigId" TEXT,
    "status" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "promptChars" INTEGER,
    "completionChars" INTEGER,
    "latencyMs" INTEGER,
    "errorClass" TEXT,
    "errorMsg" TEXT,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "day" TEXT NOT NULL,
    "props" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "llm_call_logs_sceneKey_createdAt_idx" ON "llm_call_logs"("sceneKey", "createdAt");

-- CreateIndex
CREATE INDEX "llm_call_logs_status_createdAt_idx" ON "llm_call_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "llm_call_logs_traceId_idx" ON "llm_call_logs"("traceId");

-- CreateIndex
CREATE INDEX "llm_call_logs_day_idx" ON "llm_call_logs"("day");
