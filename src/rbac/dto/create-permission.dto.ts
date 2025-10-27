import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.export', description: 'Название права' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Экспорт пользователей', description: 'Описание права' })
  @IsString()
  description?: string;

  @ApiProperty({ example: 'users', description: 'Ресурс' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ example: 'export', description: 'Действие' })
  @IsString()
  @IsNotEmpty()
  action: string;
}
