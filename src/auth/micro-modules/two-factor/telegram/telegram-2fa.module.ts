import { Module } from '@nestjs/common';
import { TelegramTwoFactorService } from './telegram-2fa.service';

@Module({
  providers: [TelegramTwoFactorService],
  exports: [TelegramTwoFactorService],
})
export class Telegram2FAModule {}
