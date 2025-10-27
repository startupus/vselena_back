import { Module, Global } from '@nestjs/common';
import { MicroModuleRegistryService } from './services/micro-module-registry.service';
import { MicroModuleInitializerService } from './services/micro-module-initializer.service';
import { PermissionsUtilsService } from './services/permissions-utils.service';

// Импортируем модули микромодулей
import { EmailAuthModule } from '../auth/micro-modules/email-auth/email-auth.module';
import { PhoneAuthModule } from '../auth/micro-modules/phone-auth/phone-auth.module';
import { ReferralModule } from '../auth/micro-modules/referral-system/referral.module';
import { CustomRolesModule } from '../rbac/micro-modules/custom-roles/custom-roles.module';
import { UIPermissionsModule } from '../settings/micro-modules/ui-permissions/ui-permissions.module';

@Global()
@Module({
  imports: [
    EmailAuthModule,
    PhoneAuthModule,
    ReferralModule,
    CustomRolesModule,
    UIPermissionsModule,
  ],
  providers: [
    MicroModuleRegistryService, 
    MicroModuleInitializerService,
    PermissionsUtilsService
  ],
  exports: [MicroModuleRegistryService, MicroModuleInitializerService, PermissionsUtilsService],
})
export class MicroModulesModule {}
