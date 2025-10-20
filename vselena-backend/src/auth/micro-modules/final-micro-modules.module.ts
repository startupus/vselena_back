import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MicroModuleManagerService } from './manager/micro-module-manager.service';
import { MicroModuleManagerController } from './manager/micro-module-manager.controller';

// Simple Services
import { SimpleEmail2FAService } from './two-factor/email/simple-email-2fa.service';
import { SimpleSms2FAService } from './two-factor/sms/simple-sms-2fa.service';
import { SimpleTelegram2FAService } from './two-factor/telegram/simple-telegram-2fa.service';
import { SimpleRolePromotionService } from './role-promotion/simple-role-promotion.service';

// 2FA Controllers
import { EmailTwoFactorController } from './two-factor/email/email-2fa.controller';
import { SmsTwoFactorController } from './two-factor/sms/sms-2fa.controller';
import { TelegramTwoFactorController } from './two-factor/telegram/telegram-2fa.controller';

// 2FA Services
import { EmailTwoFactorService } from './two-factor/email/email-2fa.service';
import { SmsTwoFactorService } from './two-factor/sms/sms-2fa.service';
import { TelegramTwoFactorService } from './two-factor/telegram/telegram-2fa.service';

// External Services
import { EmailService } from '../email.service';
import { SmsService } from '../sms.service';

// Invitations Module
import { InvitationsModule } from './invitations/invitations.module';

// Entities
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { TwoFactorCode } from '../entities/two-factor-code.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, TwoFactorCode, RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
    InvitationsModule,
  ],
  providers: [
    MicroModuleManagerService,
    SimpleEmail2FAService,
    SimpleSms2FAService,
    SimpleTelegram2FAService,
    SimpleRolePromotionService,
    EmailService,
    SmsService,
    EmailTwoFactorService,
    SmsTwoFactorService,
    TelegramTwoFactorService,
  ],
  controllers: [
    MicroModuleManagerController,
    EmailTwoFactorController,
    SmsTwoFactorController,
    TelegramTwoFactorController,
  ],
  exports: [
    MicroModuleManagerService,
    SimpleEmail2FAService,
    SimpleSms2FAService,
    SimpleTelegram2FAService,
    SimpleRolePromotionService,
    EmailTwoFactorService,
    SmsTwoFactorService,
    TelegramTwoFactorService,
  ],
})
export class FinalMicroModulesModule {
  static forRoot(): DynamicModule {
    return {
      module: FinalMicroModulesModule,
      imports: [
        TypeOrmModule.forFeature([User, Role, TwoFactorCode, RefreshToken]),
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'default-secret',
          signOptions: { expiresIn: '15m' },
        }),
        InvitationsModule,
      ],
      providers: [
        MicroModuleManagerService,
        SimpleEmail2FAService,
        SimpleSms2FAService,
        SimpleTelegram2FAService,
        SimpleRolePromotionService,
        EmailService,
        SmsService,
        EmailTwoFactorService,
        SmsTwoFactorService,
        TelegramTwoFactorService,
      ],
      controllers: [
        MicroModuleManagerController,
        EmailTwoFactorController,
        SmsTwoFactorController,
        TelegramTwoFactorController,
      ],
      exports: [
        MicroModuleManagerService,
        SimpleEmail2FAService,
        SimpleSms2FAService,
        SimpleTelegram2FAService,
        SimpleRolePromotionService,
        EmailTwoFactorService,
        SmsTwoFactorService,
        TelegramTwoFactorService,
      ],
    };
  }
}
