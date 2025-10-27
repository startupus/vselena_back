import { ApiProperty } from '@nestjs/swagger';

export class ReferralStatsDto {
  @ApiProperty({ description: 'Общее количество реферальных ссылок' })
  totalReferralLinks: number;

  @ApiProperty({ description: 'Общее количество переходов по ссылкам' })
  totalClicks: number;

  @ApiProperty({ description: 'Общее количество конверсий (регистраций)' })
  totalConversions: number;

  @ApiProperty({ description: 'Процент конверсии' })
  conversionRate: number;

  @ApiProperty({ description: 'Активные реферальные ссылки' })
  activeReferralLinks: number;

  @ApiProperty({ description: 'Истекшие реферальные ссылки' })
  expiredReferralLinks: number;
}

export class ReferralLinkStatsDto {
  @ApiProperty({ description: 'ID реферальной ссылки' })
  id: string;

  @ApiProperty({ description: 'Реферальный код' })
  referralCode: string;

  @ApiProperty({ description: 'Количество переходов' })
  clickCount: number;

  @ApiProperty({ description: 'Количество конверсий' })
  conversionCount: number;

  @ApiProperty({ description: 'Процент конверсии' })
  conversionRate: number;

  @ApiProperty({ description: 'Статус ссылки' })
  status: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего перехода', required: false })
  lastClickAt?: Date;
}
