import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MicroModuleRegistryService } from './micro-module-registry.service';
import { EmailAuthMicroModule } from '../../auth/micro-modules/email-auth/email-auth.micro-module';
import { PhoneAuthMicroModule } from '../../auth/micro-modules/phone-auth/phone-auth.micro-module';
import { ReferralMicroModule } from '../../auth/micro-modules/referral-system/referral.micro-module';
import { CustomRolesMicroModule } from '../../rbac/micro-modules/custom-roles/custom-roles.micro-module';
import { UIPermissionsMicroModule } from '../../settings/micro-modules/ui-permissions/ui-permissions.micro-module';

@Injectable()
export class MicroModuleInitializerService implements OnModuleInit {
  private readonly logger = new Logger(MicroModuleInitializerService.name);

  constructor(
    private readonly microModuleRegistry: MicroModuleRegistryService,
    private readonly emailAuthMicroModule: EmailAuthMicroModule,
    private readonly phoneAuthMicroModule: PhoneAuthMicroModule,
    private readonly referralMicroModule: ReferralMicroModule,
    private readonly customRolesMicroModule: CustomRolesMicroModule,
    private readonly uiPermissionsMicroModule: UIPermissionsMicroModule,
  ) {}

  async onModuleInit() {
    this.logger.log('Инициализация микромодулей...');
    
    try {
      // Регистрируем все микромодули
      await this.microModuleRegistry.registerModule(this.emailAuthMicroModule);
      await this.microModuleRegistry.registerModule(this.phoneAuthMicroModule);
      await this.microModuleRegistry.registerModule(this.referralMicroModule);
      await this.microModuleRegistry.registerModule(this.customRolesMicroModule);
      await this.microModuleRegistry.registerModule(this.uiPermissionsMicroModule);
      
      this.logger.log('Все микромодули инициализированы.');
    } catch (error) {
      this.logger.error('Ошибка инициализации микромодулей:', error);
    }
  }
}