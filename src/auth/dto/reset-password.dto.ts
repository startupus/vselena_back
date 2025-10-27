import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'abc123def456',
    description: 'Токен восстановления пароля'
  })
  @IsString()
  token: string;

  @ApiProperty({ 
    example: 'newpassword123',
    description: 'Новый пароль',
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  newPassword: string;
}
