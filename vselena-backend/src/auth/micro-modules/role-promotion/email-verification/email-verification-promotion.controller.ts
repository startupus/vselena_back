import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { EmailVerificationPromotionService } from './email-verification-promotion.service';

@ApiTags('Email Verification Promotion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role-promotion/email-verification')
export class EmailVerificationPromotionController {
  constructor(
    private readonly emailVerificationPromotionService: EmailVerificationPromotionService,
  ) {}

  @Post('check-condition')
  @ApiOperation({ summary: 'Проверить условие повышения роли при подтверждении email' })
  @ApiResponse({ status: 200, description: 'Условие проверено' })
  async checkCondition(@Req() req) {
    const user = req.user;
    const condition = this.emailVerificationPromotionService.getPromotionCondition();
    
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
  @ApiOperation({ summary: 'Применить условие повышения роли при подтверждении email' })
  @ApiResponse({ status: 200, description: 'Условие применено' })
  async applyCondition(@Req() req) {
    const user = req.user;
    const applied = await this.emailVerificationPromotionService.checkAndApplyCondition(user);
    
    return {
      applied,
      message: applied 
        ? 'Роль успешно повышена после подтверждения email'
        : 'Условие не выполнено',
    };
  }
}
