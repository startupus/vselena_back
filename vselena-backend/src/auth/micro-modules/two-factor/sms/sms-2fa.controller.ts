import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SmsTwoFactorService } from './sms-2fa.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../decorators/current-user.decorator';

export class SendSmsCodeDto {
  phone: string;
}

export class VerifySmsCodeDto {
  code: string;
}

@ApiTags('2fa-sms')
@Controller('2fa/sms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SmsTwoFactorController {
  constructor(private smsTwoFactorService: SmsTwoFactorService) {}

  @Post('send-code')
  @ApiOperation({ summary: 'Отправка 2FA кода на SMS' })
  @ApiResponse({ status: 200, description: 'Код отправлен' })
  @ApiResponse({ status: 429, description: 'Слишком много запросов' })
  async sendCode(
    @Body() dto: SendSmsCodeDto,
    @CurrentUser() user: any,
  ) {
    return this.smsTwoFactorService.sendSmsCode(user.userId, dto.phone);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Проверка 2FA кода' })
  @ApiResponse({ status: 200, description: 'Код подтвержден' })
  @ApiResponse({ status: 400, description: 'Неверный или истекший код' })
  async verifyCode(
    @Body() dto: VerifySmsCodeDto,
    @CurrentUser() user: any,
  ) {
    return this.smsTwoFactorService.verifySmsCode(user.userId, dto.code);
  }
}
