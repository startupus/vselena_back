import { Module } from '@nestjs/common';
import { MicroModulesController } from './controllers/micro-modules.controller';
import { TestController } from './controllers/test.controller';

@Module({
  controllers: [MicroModulesController, TestController],
})
export class CommonModule {}
