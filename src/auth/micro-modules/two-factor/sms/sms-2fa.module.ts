import { Module } from '@nestjs/common';
import { SmsTwoFactorService } from './sms-2fa.service';
import { SmsTwoFactorController } from './sms-2fa.controller';

@Module({
  providers: [SmsTwoFactorService],
  controllers: [SmsTwoFactorController],
  exports: [SmsTwoFactorService],
})
export class Sms2FAModule {}
