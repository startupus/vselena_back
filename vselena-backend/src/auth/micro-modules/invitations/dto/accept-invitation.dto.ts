import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'invitation-token-here' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password?: string;

  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов' })
  firstName?: string;

  @ApiProperty({ example: 'Петров', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Фамилия должна быть не менее 2 символов' })
  lastName?: string;
}
