import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorSettingsService } from './two-factor-settings.service';
import { TwoFactorMethod, TwoFactorSettings } from './enums/two-factor-method.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('two-factor-settings')
@Controller('two-factor-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorSettingsController {
  constructor(
    private readonly twoFactorSettingsService: TwoFactorSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить настройки 2FA текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Настройки 2FA получены' })
  async getSettings(@CurrentUser() user: any): Promise<TwoFactorSettings> {
    return this.twoFactorSettingsService.getUserTwoFactorSettings(user.userId);
  }

  @Post('enable')
  @ApiOperation({ summary: 'Включить 2FA для текущего пользователя' })
  @ApiResponse({ status: 200, description: '2FA включен' })
  @ApiResponse({ status: 400, description: 'Неверные методы 2FA' })
  async enableTwoFactor(
    @CurrentUser() user: any,
    @Body() body: { methods?: TwoFactorMethod[] } = {},
  ): Promise<TwoFactorSettings> {
    // Если методы не переданы, используем email как метод по умолчанию
    const methods = body.methods || [TwoFactorMethod.EMAIL];
    return this.twoFactorSettingsService.enableTwoFactor(user.userId, methods);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Отключить 2FA для текущего пользователя' })
  @ApiResponse({ status: 200, description: '2FA отключен' })
  async disableTwoFactor(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.twoFactorSettingsService.disableTwoFactor(user.userId);
    return { message: '2FA disabled successfully' };
  }

  @Post('methods')
  @ApiOperation({ summary: 'Добавить метод 2FA' })
  @ApiResponse({ status: 200, description: 'Метод добавлен' })
  @ApiResponse({ status: 400, description: 'Метод уже включен или не подтвержден' })
  async addMethod(
    @CurrentUser() user: any,
    @Body() body: { method: TwoFactorMethod },
  ): Promise<TwoFactorSettings> {
    return this.twoFactorSettingsService.addTwoFactorMethod(user.userId, body.method);
  }

  @Delete('methods/:method')
  @ApiOperation({ summary: 'Удалить метод 2FA' })
  @ApiResponse({ status: 200, description: 'Метод удален' })
  async removeMethod(
    @CurrentUser() user: any,
    @Param('method') method: TwoFactorMethod,
  ): Promise<TwoFactorSettings> {
    return this.twoFactorSettingsService.removeTwoFactorMethod(user.userId, method);
  }

  @Post('verify/email')
  @ApiOperation({ summary: 'Подтвердить email для 2FA' })
  @ApiResponse({ status: 200, description: 'Email подтвержден' })
  async verifyEmail(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.twoFactorSettingsService.verifyEmailForTwoFactor(user.userId);
    return { message: 'Email verified for 2FA' };
  }

  @Post('verify/phone')
  @ApiOperation({ summary: 'Подтвердить телефон для 2FA' })
  @ApiResponse({ status: 200, description: 'Телефон подтвержден' })
  async verifyPhone(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.twoFactorSettingsService.verifyPhoneForTwoFactor(user.userId);
    return { message: 'Phone verified for 2FA' };
  }

  @Post('setup/totp')
  @ApiOperation({ summary: 'Настроить TOTP (Google Authenticator)' })
  @ApiResponse({ status: 200, description: 'TOTP настроен' })
  async setupTotp(@CurrentUser() user: any): Promise<{ secret: string; qrCode: string }> {
    return this.twoFactorSettingsService.setupTotp(user.userId);
  }

  @Post('backup-codes/use')
  @ApiOperation({ summary: 'Использовать резервный код' })
  @ApiResponse({ status: 200, description: 'Код использован' })
  @ApiResponse({ status: 400, description: 'Неверный или уже использованный код' })
  async useBackupCode(
    @CurrentUser() user: any,
    @Body() body: { code: string },
  ): Promise<{ valid: boolean }> {
    const valid = await this.twoFactorSettingsService.useBackupCode(user.userId, body.code);
    return { valid };
  }
}
