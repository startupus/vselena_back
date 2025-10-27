import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UIPermissionsService } from './ui-permissions.service';
import { UIPermissionsController } from './ui-permissions.controller';
import { UIPermissionsMicroModule } from './ui-permissions.micro-module';
import { UIElement } from './entities/ui-element.entity';
import { UIGroup } from './entities/ui-group.entity';
import { NavigationMenu } from './entities/navigation-menu.entity';
import { User } from '../../../users/entities/user.entity';
import { CommonModule } from '../../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UIElement, UIGroup, NavigationMenu, User]),
    CommonModule,
  ],
  controllers: [UIPermissionsController],
  providers: [UIPermissionsService, UIPermissionsMicroModule],
  exports: [UIPermissionsService, UIPermissionsMicroModule],
})
export class UIPermissionsModule {}
