import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { SettingsModule } from './settings/settings.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './auth/micro-modules/invitations/invitations.module';
import { InvitationsController } from './auth/micro-modules/invitations/invitations.controller';
import { TestInvitationsController } from './test-invitations.controller';
import { EmailService } from './auth/email.service';
import { Invitation } from './auth/micro-modules/invitations/entities/invitation.entity';
import { User } from './users/entities/user.entity';
import { OrganizationMembership } from './organizations/entities/organization-membership.entity';
import { TeamMembership } from './teams/entities/team-membership.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AuditInterceptor } from './audit/audit.interceptor';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';

// Общие сервисы
import { CommonModule } from './common/common.module';
import { MicroModulesModule } from './common/micro-modules.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database')!,
      inject: [ConfigService],
    }),

    // Additional entities
    TypeOrmModule.forFeature([
      Invitation, 
      User,
      OrganizationMembership,
      TeamMembership
    ]),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
        AuthModule,
        UsersModule,
        RbacModule,
        SettingsModule,
        OrganizationsModule,
        TeamsModule,
        AuditModule,
        NotificationsModule,
        InvitationsModule,
        
        // Общие модули
        CommonModule,
        MicroModulesModule,
  ],
  controllers: [AppController, InvitationsController, TestInvitationsController],
  providers: [
    AppService,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // PermissionsGuard отключен - роли только для отображения в командах/организациях
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}