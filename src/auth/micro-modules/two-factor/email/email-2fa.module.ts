import { Module } from '@nestjs/common';
import { EmailTwoFactorService } from './email-2fa.service';
import { EmailTwoFactorController } from './email-2fa.controller';

@Module({
  providers: [EmailTwoFactorService],
  controllers: [EmailTwoFactorController],
  exports: [EmailTwoFactorService],
})
export class Email2FAModule {}
