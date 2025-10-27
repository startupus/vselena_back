import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { TwoFactorPromotionService } from './two-factor-promotion.service';

@ApiTags('Two-Factor Promotion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role-promotion/two-factor')
export class TwoFactorPromotionController {
  constructor(
    private readonly twoFactorPromotionService: TwoFactorPromotionService,
  ) {}

  @Post('check-condition')
  @ApiOperation({ summary: 'Проверить условие повышения роли при включении 2FA' })
  @ApiResponse({ status: 200, description: 'Условие проверено' })
  async checkCondition(@Req() req) {
    const user = req.user;
    const condition = this.twoFactorPromotionService.getPromotionCondition();
    
    return {
      condition: {
        id: condition.id,
        name: condition.name,
        description: condition.description,
      },
      isMet: await condition.check(user),
    };
  }

  @Post('apply-condition')
  @ApiOperation({ summary: 'Применить условие повышения роли при включении 2FA' })
  @ApiResponse({ status: 200, description: 'Условие применено' })
  async applyCondition(@Req() req) {
    const user = req.user;
    const applied = await this.twoFactorPromotionService.checkAndApplyCondition(user);
    
    return {
      applied,
      message: applied 
        ? 'Роль успешно повышена после включения 2FA'
        : 'Условие не выполнено',
    };
  }
}
