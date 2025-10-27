import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { GenerateReferralLinkDto } from './dto/generate-referral-link.dto';
import { TrackReferralDto } from './dto/track-referral.dto';
import { ReferralLinkResponseDto } from './dto/referral-link-response.dto';
import { ReferralStatsDto, ReferralLinkStatsDto } from './dto/referral-stats.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Public } from '../../decorators/public.decorator';

@ApiTags('referrals')
@Controller('auth/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post('generate-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Генерация реферальной ссылки' })
  @ApiResponse({ status: 201, description: 'Реферальная ссылка успешно создана', type: ReferralLinkResponseDto })
  @ApiResponse({ status: 400, description: 'Неверные данные или код уже существует' })
  @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
  async generateReferralLink(
    @Body() dto: GenerateReferralLinkDto,
    @Request() req,
  ): Promise<ReferralLinkResponseDto> {
    return this.referralsService.generateReferralLink(req.user.userId, dto);
  }

  @Post('track-click')
  @Public()
  @ApiOperation({ summary: 'Отслеживание клика по реферальной ссылке' })
  @ApiResponse({ status: 200, description: 'Клик успешно отслежен' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async trackReferralClick(@Body() dto: TrackReferralDto) {
    return this.referralsService.trackReferralClick(dto);
  }

  @Post('attach-user')
  @Public()
  @ApiOperation({ summary: 'Привязка зарегистрированного пользователя к рефералу' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно привязан к рефералу' })
  @ApiResponse({ status: 400, description: 'Неверные данные или ссылка истекла' })
  async attachReferralToUser(
    @Body() body: { userId: string; referralCode: string },
  ) {
    return this.referralsService.attachReferralToUser(body.userId, body.referralCode);
  }

  @Get('my-links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение всех реферальных ссылок пользователя' })
  @ApiResponse({ status: 200, description: 'Список реферальных ссылок', type: [ReferralLinkResponseDto] })
  @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
  async getUserReferralLinks(@Request() req): Promise<ReferralLinkResponseDto[]> {
    return this.referralsService.getUserReferralLinks(req.user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение статистики рефералов пользователя' })
  @ApiResponse({ status: 200, description: 'Статистика рефералов', type: ReferralStatsDto })
  @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
  async getUserReferralStats(@Request() req): Promise<ReferralStatsDto> {
    return this.referralsService.getUserReferralStats(req.user.userId);
  }

  @Get('link-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение детальной статистики по реферальным ссылкам' })
  @ApiResponse({ status: 200, description: 'Детальная статистика ссылок', type: [ReferralLinkStatsDto] })
  @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
  async getReferralLinkStats(@Request() req): Promise<ReferralLinkStatsDto[]> {
    return this.referralsService.getReferralLinkStats(req.user.userId);
  }

  @Get('referrer/:code')
  @Public()
  @ApiOperation({ summary: 'Получение информации о реферере по коду' })
  @ApiResponse({ status: 200, description: 'Информация о реферере' })
  @ApiResponse({ status: 404, description: 'Реферальный код не найден или истек' })
  async getReferrerByCode(@Param('code') code: string) {
    return this.referralsService.getReferrerByCode(code);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление реферальной ссылки' })
  @ApiResponse({ status: 200, description: 'Реферальная ссылка успешно удалена' })
  @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
  @ApiResponse({ status: 404, description: 'Реферальная ссылка не найдена' })
  async deleteReferralLink(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.referralsService.deleteReferralLink(req.user.userId, id);
  }
}
