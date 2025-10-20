import { ApiProperty } from '@nestjs/swagger';

export class ReferralLinkResponseDto {
  @ApiProperty({ description: 'ID реферальной записи' })
  id: string;

  @ApiProperty({ description: 'Реферальный код' })
  referralCode: string;

  @ApiProperty({ description: 'Полная реферальная ссылка' })
  referralLink: string;

  @ApiProperty({ description: 'Статус реферальной ссылки' })
  status: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата истечения', required: false })
  expiresAt?: Date;

  @ApiProperty({ description: 'Количество переходов по ссылке' })
  clickCount: number;

  @ApiProperty({ description: 'Количество конверсий (регистраций)' })
  conversionCount: number;
}
