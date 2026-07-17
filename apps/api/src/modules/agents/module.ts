import { Module } from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { LlmService } from '../../llm/llm.service';
import { AgentsController } from './rest/agents.controller';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
