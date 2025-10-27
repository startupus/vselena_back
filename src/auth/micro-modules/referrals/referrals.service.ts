import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User } from '../../../users/entities/user.entity';
import { GenerateReferralLinkDto } from './dto/generate-referral-link.dto';
import { TrackReferralDto } from './dto/track-referral.dto';
import { ReferralLinkResponseDto } from './dto/referral-link-response.dto';
import { ReferralStatsDto, ReferralLinkStatsDto } from './dto/referral-stats.dto';
import * as crypto from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralsRepo: Repository<Referral>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private configService: ConfigService,
  ) {}

  /**
   * Генерация реферальной ссылки для пользователя
   */
  async generateReferralLink(
    userId: string,
    dto: GenerateReferralLinkDto,
  ): Promise<ReferralLinkResponseDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Генерируем уникальный код
    const referralCode = dto.customCode || this.generateReferralCode();
    
    // Проверяем уникальность кода
    const existingReferral = await this.referralsRepo.findOne({
      where: { referralCode },
    });
    
    if (existingReferral) {
      throw new BadRequestException('Referral code already exists');
    }

    // Вычисляем дату истечения
    const expiresInDays = dto.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Создаем реферальную запись
    const referral = this.referralsRepo.create({
      referrerId: userId,
      referralCode,
      status: ReferralStatus.PENDING,
      expiresAt,
      metadata: dto.metadata || {},
    });

    await this.referralsRepo.save(referral);

    // Формируем полную ссылку
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const referralLink = `${frontendUrl}/register?ref=${referralCode}`;

    return {
      id: referral.id,
      referralCode: referral.referralCode,
      referralLink,
      status: referral.status,
      createdAt: referral.createdAt,
      expiresAt: referral.expiresAt,
      clickCount: 0,
      conversionCount: 0,
    };
  }

  /**
   * Отслеживание перехода по реферальной ссылке
   */
  async trackReferralClick(dto: TrackReferralDto): Promise<{ success: boolean; referrerId?: string }> {
    const referral = await this.referralsRepo.findOne({
      where: { referralCode: dto.referralCode },
      relations: ['referrer'],
    });

    if (!referral) {
      return { success: false };
    }

    // Проверяем, не истекла ли ссылка
    if (referral.expiresAt && referral.expiresAt < new Date()) {
      referral.status = ReferralStatus.EXPIRED;
      await this.referralsRepo.save(referral);
      return { success: false };
    }

    // Обновляем метаданные с информацией о клике
    const updatedMetadata = {
      ...referral.metadata,
      lastClickAt: new Date().toISOString(),
      lastClickIp: dto.ipAddress,
      lastClickUserAgent: dto.userAgent,
      clickCount: (referral.metadata?.clickCount || 0) + 1,
      ...dto.metadata,
    };

    referral.metadata = updatedMetadata;
    if (dto.ipAddress) {
      referral.ipAddress = dto.ipAddress;
    }
    if (dto.userAgent) {
      referral.userAgent = dto.userAgent;
    }

    await this.referralsRepo.save(referral);

    return { 
      success: true, 
      referrerId: referral.referrerId 
    };
  }

  /**
   * Привязка зарегистрированного пользователя к рефералу
   */
  async attachReferralToUser(
    userId: string,
    referralCode: string,
  ): Promise<{ success: boolean; referrerId?: string }> {
    const referral = await this.referralsRepo.findOne({
      where: { referralCode },
      relations: ['referrer'],
    });

    if (!referral) {
      return { success: false };
    }

    // Проверяем, не истекла ли ссылка
    if (referral.expiresAt && referral.expiresAt < new Date()) {
      referral.status = ReferralStatus.EXPIRED;
      await this.referralsRepo.save(referral);
      return { success: false };
    }

    // Проверяем, не привязан ли уже пользователь
    if (referral.referredUserId) {
      return { success: false };
    }

    // Привязываем пользователя к рефералу
    referral.referredUserId = userId;
    referral.status = ReferralStatus.CONVERTED;
    referral.convertedAt = new Date();

    // Обновляем счетчик конверсий
    const updatedMetadata = {
      ...referral.metadata,
      conversionCount: (referral.metadata?.conversionCount || 0) + 1,
      convertedAt: new Date().toISOString(),
    };
    referral.metadata = updatedMetadata;

    await this.referralsRepo.save(referral);

    console.log(`✅ Пользователь ${userId} привязан к рефералу ${referral.referrerId}`);

    return { 
      success: true, 
      referrerId: referral.referrerId 
    };
  }

  /**
   * Получение всех реферальных ссылок пользователя
   */
  async getUserReferralLinks(userId: string): Promise<ReferralLinkResponseDto[]> {
    const referrals = await this.referralsRepo.find({
      where: { referrerId: userId },
      order: { createdAt: 'DESC' },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return referrals.map(referral => ({
      id: referral.id,
      referralCode: referral.referralCode,
      referralLink: `${frontendUrl}/register?ref=${referral.referralCode}`,
      status: referral.status,
      createdAt: referral.createdAt,
      expiresAt: referral.expiresAt,
      clickCount: referral.metadata?.clickCount || 0,
      conversionCount: referral.metadata?.conversionCount || 0,
    }));
  }

  /**
   * Получение статистики рефералов пользователя
   */
  async getUserReferralStats(userId: string): Promise<ReferralStatsDto> {
    const referrals = await this.referralsRepo.find({
      where: { referrerId: userId },
    });

    const totalReferralLinks = referrals.length;
    const totalClicks = referrals.reduce((sum, ref) => sum + (ref.metadata?.clickCount || 0), 0);
    const totalConversions = referrals.reduce((sum, ref) => sum + (ref.metadata?.conversionCount || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const activeReferralLinks = referrals.filter(ref => 
      ref.status === ReferralStatus.PENDING && 
      (!ref.expiresAt || ref.expiresAt > new Date())
    ).length;
    const expiredReferralLinks = referrals.filter(ref => 
      ref.status === ReferralStatus.EXPIRED || 
      (ref.expiresAt && ref.expiresAt <= new Date())
    ).length;

    return {
      totalReferralLinks,
      totalClicks,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      activeReferralLinks,
      expiredReferralLinks,
    };
  }

  /**
   * Получение детальной статистики по реферальным ссылкам
   */
  async getReferralLinkStats(userId: string): Promise<ReferralLinkStatsDto[]> {
    const referrals = await this.referralsRepo.find({
      where: { referrerId: userId },
      order: { createdAt: 'DESC' },
    });

    return referrals.map(referral => {
      const clickCount = referral.metadata?.clickCount || 0;
      const conversionCount = referral.metadata?.conversionCount || 0;
      const conversionRate = clickCount > 0 ? (conversionCount / clickCount) * 100 : 0;

      return {
        id: referral.id,
        referralCode: referral.referralCode,
        clickCount,
        conversionCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        status: referral.status,
        createdAt: referral.createdAt,
        lastClickAt: referral.metadata?.lastClickAt ? new Date(referral.metadata.lastClickAt) : undefined,
      };
    });
  }

  /**
   * Получение информации о реферере по коду
   */
  async getReferrerByCode(referralCode: string): Promise<{ referrerId: string; referrerEmail: string } | null> {
    const referral = await this.referralsRepo.findOne({
      where: { referralCode },
      relations: ['referrer'],
    });

    if (!referral || !referral.referrer) {
      return null;
    }

    // Проверяем, не истекла ли ссылка
    if (referral.expiresAt && referral.expiresAt < new Date()) {
      return null;
    }

    return {
      referrerId: referral.referrer.id,
      referrerEmail: referral.referrer.email || '',
    };
  }

  /**
   * Генерация уникального реферального кода
   */
  private generateReferralCode(): string {
    const length = 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Удаление реферальной ссылки
   */
  async deleteReferralLink(userId: string, referralId: string): Promise<void> {
    const referral = await this.referralsRepo.findOne({
      where: { id: referralId, referrerId: userId },
    });

    if (!referral) {
      throw new NotFoundException('Referral link not found');
    }

    await this.referralsRepo.delete(referralId);
  }
}
