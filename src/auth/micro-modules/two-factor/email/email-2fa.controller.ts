import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EmailTwoFactorService } from './email-2fa.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { Public } from '../../../decorators/public.decorator';
import { Request } from 'express';

@Controller('auth/2fa/email')
export class EmailTwoFactorController {
  constructor(private readonly emailTwoFactorService: EmailTwoFactorService) {}

  @Post('send-code')
  @Public()
  async sendEmailCode(@Body('email') email: string) {
    if (!email) {
      throw new Error('Email обязателен');
    }

    // Находим пользователя по email
    const user = await this.emailTwoFactorService.findUserByEmail(email);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return this.emailTwoFactorService.sendEmailCode(user.id, email);
  }

  @Post('verify-code')
  @Public()
  async verifyEmailCode(@Body('email') email: string, @Body('code') code: string) {
    if (!email || !code) {
      throw new Error('Email и код обязательны');
    }

    // Находим пользователя по email
    const user = await this.emailTwoFactorService.findUserByEmail(email);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const result = await this.emailTwoFactorService.verifyEmailCode(user.id, code);
    
    if (result.success) {
      // Генерируем токены для входа
      const tokens = await this.emailTwoFactorService.generateTokensForUser(user);
      return {
        ...result,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.userRoleAssignments?.map(a => a.role?.name).filter(Boolean) || [],
          permissions: user.userRoleAssignments?.flatMap(a => a.role?.permissions?.map(p => p.name) || []) || []
        },
        ...tokens
      };
    }

    return result;
  }
}