import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackReferralDto {
  @ApiProperty({ 
    description: 'Реферальный код из ссылки',
    example: 'abc123def456'
  })
  @IsString()
  referralCode: string;

  @ApiProperty({ 
    required: false, 
    description: 'IP адрес пользователя',
    example: '192.168.1.1'
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ 
    required: false, 
    description: 'User Agent браузера',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Дополнительные метаданные',
    example: { utm_source: 'facebook', utm_campaign: 'summer2024' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
