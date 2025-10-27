import { IsEmail, IsString, IsOptional, IsEnum, IsPhoneNumber, IsBoolean, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthMethodType } from '../enums/auth-method-type.enum';

export class RegisterWithMethodDto {
  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации' })
  @IsEnum(AuthMethodType)
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Email адрес' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Номер телефона' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Пароль (для email регистрации)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Имя' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Фамилия' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'URL аватара' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ description: 'Код авторизации (для OAuth)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Состояние (для OAuth)' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class LoginWithMethodDto {
  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации' })
  @IsEnum(AuthMethodType)
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Email адрес' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Номер телефона' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Пароль (для email входа)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Код верификации' })
  @IsOptional()
  @IsString()
  verificationCode?: string;

  @ApiProperty({ description: 'Код авторизации (для OAuth)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Состояние (для OAuth)' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class BindAuthMethodDto {
  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации для привязки' })
  @IsEnum(AuthMethodType)
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Email адрес' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Номер телефона' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Пароль (для email привязки)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Код авторизации (для OAuth)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Состояние (для OAuth)' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class VerifyCodeDto {
  @ApiProperty({ description: 'Код верификации' })
  @IsString()
  code: string;

  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации' })
  @IsEnum(AuthMethodType)
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Идентификатор (email, phone, etc.)' })
  @IsString()
  identifier: string;
}

export class SetupMfaDto {
  @ApiProperty({ 
    enum: AuthMethodType, 
    isArray: true,
    description: 'Требуемые методы для MFA' 
  })
  @IsArray()
  @IsEnum(AuthMethodType, { each: true })
  requiredMethods: AuthMethodType[];
}

export class MergeResolutionDto {
  @ApiProperty({ description: 'Email для слияния', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Имя для слияния', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Фамилия для слияния', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Телефон для слияния', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Роли в организациях для слияния', required: false })
  @IsOptional()
  @IsObject()
  organizations?: { [orgId: string]: string };

  @ApiProperty({ description: 'Роли в командах для слияния', required: false })
  @IsOptional()
  @IsObject()
  teams?: { [teamId: string]: string };
}

export class SendVerificationCodeDto {
  @ApiProperty({ description: 'Идентификатор (email, phone, etc.)' })
  @IsString()
  identifier: string;

  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации' })
  @IsEnum(AuthMethodType)
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Цель отправки кода' })
  @IsString()
  purpose: string;
}

export class AuthMethodResponseDto {
  @ApiProperty({ enum: AuthMethodType, description: 'Метод аутентификации' })
  authMethod: AuthMethodType;

  @ApiProperty({ description: 'Статус верификации' })
  verified: boolean;

  @ApiProperty({ description: 'Идентификатор' })
  identifier: string;

  @ApiProperty({ description: 'Дата последнего использования', required: false })
  lastUsed?: Date;
}

export class UserAuthMethodsDto {
  @ApiProperty({ enum: AuthMethodType, description: 'Основной метод аутентификации' })
  primaryAuthMethod: AuthMethodType;

  @ApiProperty({ 
    type: [AuthMethodResponseDto],
    description: 'Доступные методы аутентификации' 
  })
  availableMethods: AuthMethodResponseDto[];

  @ApiProperty({ description: 'Настройки MFA', required: false })
  mfaSettings?: {
    enabled: boolean;
    requiredMethods: AuthMethodType[];
  };

  @ApiProperty({ description: 'Предпочтения мессенджеров', required: false })
  messengerPreferences?: {
    preferredMessenger: 'whatsapp' | 'telegram' | 'both';
    whatsappEnabled: boolean;
    telegramEnabled: boolean;
  };
}
