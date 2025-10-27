import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultRoleDto {
  @ApiProperty({ 
    description: 'Роль по умолчанию для новых пользователей',
    enum: ['super_admin', 'admin', 'viewer']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['super_admin', 'admin', 'viewer'])
  roleName: string;
}
