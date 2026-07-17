import { Module } from '@nestjs/common';
import { TodoController } from './rest/todo.controller';

@Module({
  controllers: [TodoController],
  providers: [],
  exports: [],
})
export class TodoModule {}
