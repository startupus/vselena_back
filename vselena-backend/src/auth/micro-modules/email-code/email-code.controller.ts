import { Controller, Post, Body } from '@nestjs/common';
import { EmailCodeService } from './email-code.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth/email-code')
export class EmailCodeController {
  constructor(private readonly emailCodeService: EmailCodeService) {}

  @Post('send')
  @Public()
  @ApiOperation({ summary: 'Отправить код на почту для входа' })
  @ApiResponse({ status: 200, description: 'Код отправлен на почту' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async sendCode(@Body('email') email: string) {
    if (!email) {
      throw new Error('Email обязателен');
    }

    return this.emailCodeService.sendLoginCode(email);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Войти по коду с почты' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 400, description: 'Неверный код' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async loginWithCode(@Body('code') code: string) {
    if (!code) {
      throw new Error('Код обязателен');
    }

    return this.emailCodeService.loginWithCode(code);
  }
}
