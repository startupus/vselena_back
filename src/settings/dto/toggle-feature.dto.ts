import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFeatureDto {
  @ApiProperty({ description: 'Включить или отключить функцию' })
  @IsBoolean()
  isEnabled: boolean;
}
