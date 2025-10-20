import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SmartAuthDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Петров', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'abc123def456', required: false, description: 'Реферальный код' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class SmartAuthResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  needsAdditionalInfo?: boolean;

  @ApiProperty({ required: false })
  missingFields?: string[];
}
