import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterEmailDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email адрес пользователя'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'Пароль пользователя'
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    required: false,
    example: 'Иван',
    description: 'Имя пользователя'
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    required: false,
    example: 'Петров',
    description: 'Фамилия пользователя'
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID организации'
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ 
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID команды'
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}
