import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelegramTwoFactorService } from './telegram-2fa.service';

@ApiTags('2fa-telegram')
@Controller('2fa/telegram')
export class TelegramTwoFactorController {
  constructor(private readonly telegramTwoFactorService: TelegramTwoFactorService) {}

  @Post('send-code')
  @ApiOperation({ summary: 'Отправка 2FA кода через Telegram' })
  @ApiResponse({ status: 200, description: 'Код отправлен' })
  async sendCode(@Body() body: { chatId: string; code: string }) {
    const result = await this.telegramTwoFactorService.sendTelegramCode(body.chatId, body.code);
    return { success: result };
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Верификация 2FA кода через Telegram' })
  @ApiResponse({ status: 200, description: 'Код верифицирован' })
  async verifyCode(@Body() body: { chatId: string; code: string }) {
    const result = await this.telegramTwoFactorService.verifyTelegramCode(body.chatId, body.code);
    return { success: result };
  }
}
