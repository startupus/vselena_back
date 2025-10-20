import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class SendEmailVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123def456', description: 'Токен подтверждения email' })
  @IsString({ message: 'Токен должен быть строкой' })
  @MinLength(10, { message: 'Токен должен содержать минимум 10 символов' })
  token: string;
}

export class EmailVerificationResponseDto {
  @ApiProperty({ example: true, description: 'Успешность операции' })
  success: boolean;

  @ApiProperty({ example: 'Письмо с подтверждением отправлено', description: 'Сообщение об операции' })
  message: string;

  @ApiProperty({ example: 'abc123def456', description: 'Токен подтверждения (только для тестирования)', required: false })
  verificationToken?: string;
}
