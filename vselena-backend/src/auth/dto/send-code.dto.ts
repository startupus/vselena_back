import { IsEnum, IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TwoFactorType } from '../entities/two-factor-code.entity';

export class SendCodeDto {
  @ApiProperty({
    enum: TwoFactorType,
    description: 'Тип двухфакторной аутентификации',
    example: TwoFactorType.EMAIL,
  })
  @IsEnum(TwoFactorType, { message: 'Тип должен быть email или sms' })
  type: TwoFactorType;

  @ApiProperty({
    description: 'Email адрес или номер телефона',
    example: 'user@example.com',
  })
  @IsString({ message: 'Контакт должен быть строкой' })
  contact: string;

  @ApiProperty({
    required: false,
    description: 'IP адрес пользователя',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    required: false,
    description: 'User Agent браузера',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
