import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { PhoneVerificationPromotionService } from './phone-verification-promotion.service';

@ApiTags('Phone Verification Promotion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role-promotion/phone-verification')
export class PhoneVerificationPromotionController {
  constructor(
    private readonly phoneVerificationPromotionService: PhoneVerificationPromotionService,
  ) {}

  @Post('check-condition')
  @ApiOperation({ summary: 'Проверить условие повышения роли при подтверждении телефона' })
  @ApiResponse({ status: 200, description: 'Условие проверено' })
  async checkCondition(@Req() req) {
    const user = req.user;
    const condition = this.phoneVerificationPromotionService.getPromotionCondition();
    
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
  @ApiOperation({ summary: 'Применить условие повышения роли при подтверждении телефона' })
  @ApiResponse({ status: 200, description: 'Условие применено' })
  async applyCondition(@Req() req) {
    const user = req.user;
    const applied = await this.phoneVerificationPromotionService.checkAndApplyCondition(user);
    
    return {
      applied,
      message: applied 
        ? 'Роль успешно повышена после подтверждения телефона'
        : 'Условие не выполнено',
    };
  }
}
