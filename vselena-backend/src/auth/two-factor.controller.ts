import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from './two-factor.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('two-factor')
@Controller('two-factor')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('send-code')
  @Public()
  @ApiOperation({ summary: 'Отправка кода подтверждения на email или SMS' })
  @ApiResponse({ status: 200, description: 'Код отправлен успешно' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 429, description: 'Превышен лимит отправки кодов' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.twoFactorService.sendCode(dto);
  }

  @Post('verify-code')
  @Public()
  @ApiOperation({ summary: 'Проверка кода подтверждения' })
  @ApiResponse({ status: 200, description: 'Код проверен успешно, возвращены токены' })
  @ApiResponse({ status: 401, description: 'Неверный код' })
  @ApiResponse({ status: 429, description: 'Превышено количество попыток' })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.twoFactorService.verifyCode(dto);
  }

  @Get('my-codes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение активных кодов текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список активных кодов' })
  async getMyActiveCodes(@CurrentUser() user: any) {
    return this.twoFactorService.getUserActiveCodes(user.userId);
  }

  @Delete('my-codes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отзыв всех активных кодов текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Все коды отозваны' })
  async revokeMyCodes(@CurrentUser() user: any) {
    await this.twoFactorService.revokeUserCodes(user.userId);
    return { message: 'Все активные коды отозваны' };
  }

  @Get('user/:userId/codes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение активных кодов пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'Список активных кодов пользователя' })
  async getUserActiveCodes(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.twoFactorService.getUserActiveCodes(userId);
  }

  @Delete('user/:userId/codes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отзыв всех активных кодов пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'Все коды пользователя отозваны' })
  async revokeUserCodes(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.twoFactorService.revokeUserCodes(userId);
    return { message: 'Все активные коды пользователя отозваны' };
  }

  @Post('test-sms')
  @Public()
  @ApiOperation({ summary: 'Тестирование всех SMS сервисов (SmsAero, Telegram, Fallback)' })
  @ApiResponse({ status: 200, description: 'Тест завершен, проверьте логи' })
  async testSmsServices(@Body() dto: SendCodeDto) {
    const { contact } = dto;
    const testCode = '123456';
    
    // Используем SmsService через TwoFactorService
    const smsService = this.twoFactorService['smsService'];
    
    if (smsService && smsService.testAllServices) {
      await smsService.testAllServices(contact, testCode);
    } else {
      console.log('📱 SmsService не доступен для тестирования');
    }
    
    return { 
      message: 'Тест всех SMS сервисов завершен. Проверьте логи для деталей.',
      contact,
      testCode 
    };
  }
}
