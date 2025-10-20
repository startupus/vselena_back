import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class BindPhoneDto {
  @ApiProperty({ 
    example: '+7 (999) 123-45-67', 
    description: 'Номер телефона в международном формате',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Номер телефона должен быть в международном формате (например: +79991234567)' 
  })
  phone: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ 
    example: '+7 (999) 123-45-67', 
    description: 'Номер телефона'
  })
  @IsString()
  phone: string;

  @ApiProperty({ 
    example: '123456', 
    description: 'Код подтверждения из SMS'
  })
  @IsString()
  @MinLength(4, { message: 'Код должен содержать минимум 4 символа' })
  @MaxLength(8, { message: 'Код должен содержать максимум 8 символов' })
  code: string;
}

export class BindPhoneResponseDto {
  @ApiProperty({ example: true, description: 'Успешность операции' })
  success: boolean;

  @ApiProperty({ example: 'SMS с кодом подтверждения отправлено', description: 'Сообщение' })
  message: string;

  @ApiProperty({ example: '123456', description: 'Код подтверждения (только для тестирования)', required: false })
  verificationCode?: string;
}
