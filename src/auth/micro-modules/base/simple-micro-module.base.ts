import { Injectable } from '@nestjs/common';
import { SimpleMicroModule, MicroModuleService } from './simple-micro-module.interface';

@Injectable()
export abstract class SimpleMicroModuleBase implements MicroModuleService {
  abstract getModuleInfo(): SimpleMicroModule;

  async initialize(): Promise<void> {
    const info = this.getModuleInfo();
    console.log(`🚀 Микромодуль ${info.name} v${info.version} инициализирован`);
  }

  async destroy(): Promise<void> {
    const info = this.getModuleInfo();
    console.log(`🛑 Микромодуль ${info.name} остановлен`);
  }
}
