-- CreateTable
CREATE TABLE "agent_triggers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentSlug" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "input" JSONB,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_triggers_enabled_nextRunAt_idx" ON "agent_triggers"("enabled", "nextRunAt");

-- CreateIndex
CREATE INDEX "agent_triggers_agentSlug_source_idx" ON "agent_triggers"("agentSlug", "source");
