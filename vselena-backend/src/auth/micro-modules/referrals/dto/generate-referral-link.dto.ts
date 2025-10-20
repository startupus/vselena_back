import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReferralLinkDto {
  @ApiProperty({ 
    required: false, 
    description: 'Кастомный код реферальной ссылки',
    example: 'my-custom-code'
  })
  @IsOptional()
  @IsString()
  customCode?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Срок действия ссылки в днях (по умолчанию 30)',
    example: 30,
    minimum: 1,
    maximum: 365
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Дополнительные метаданные для реферальной ссылки',
    example: { campaign: 'summer2024', source: 'social_media' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
