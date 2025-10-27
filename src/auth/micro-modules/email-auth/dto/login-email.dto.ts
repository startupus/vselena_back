import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginEmailDto {
  @ApiProperty({ 
    example: 'admin@vselena.ru',
    description: 'Email адрес пользователя'
  })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ 
    example: 'admin123',
    description: 'Пароль пользователя'
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;
}
