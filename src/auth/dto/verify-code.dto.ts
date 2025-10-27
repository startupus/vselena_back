import { IsEnum, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TwoFactorType } from '../entities/two-factor-code.entity';

export class VerifyCodeDto {
  @ApiProperty({
    description: '6-значный код подтверждения',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Код должен быть строкой' })
  @Length(6, 6, { message: 'Код должен содержать ровно 6 цифр' })
  code: string;

  @ApiProperty({
    description: 'Email адрес или номер телефона',
    example: 'user@example.com',
  })
  @IsString({ message: 'Контакт должен быть строкой' })
  contact: string;

  @ApiProperty({
    enum: TwoFactorType,
    description: 'Тип двухфакторной аутентификации',
    example: TwoFactorType.EMAIL,
  })
  @IsEnum(TwoFactorType, { message: 'Тип должен быть email или sms' })
  type: TwoFactorType;

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
