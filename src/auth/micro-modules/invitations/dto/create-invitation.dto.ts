import { IsEmail, IsString, IsEnum, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationType } from '../entities/invitation.entity';

export class CreateInvitationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

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

  @ApiProperty({ enum: InvitationType, example: InvitationType.ORGANIZATION })
  @IsEnum(InvitationType)
  type: InvitationType;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ example: 'editor', required: false })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  expiresInDays?: number;
}