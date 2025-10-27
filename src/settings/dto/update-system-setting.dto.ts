import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemSettingDto {
  @ApiProperty({ description: 'Новое значение настройки' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
