import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SmartAuthDto, SmartAuthResponseDto } from './dto/smart-auth.dto';
import { BindPhoneDto, VerifyPhoneDto, BindPhoneResponseDto } from './dto/bind-phone.dto';
import { SendEmailVerificationDto, VerifyEmailDto, EmailVerificationResponseDto } from './dto/email-verification.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Регистрация нового пользователя (первый пользователь становится админом)' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  @ApiResponse({ status: 409, description: 'Email уже существует' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({ status: 200, description: 'Успешная авторизация' })
  @ApiResponse({ status: 401, description: 'Неверные credentials' })
  @ApiResponse({ status: 202, description: 'Требуется 2FA' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('2fa/complete')
  @Public()
  @ApiOperation({ summary: 'Завершение входа с 2FA' })
  @ApiResponse({ status: 200, description: '2FA успешно пройден' })
  @ApiResponse({ status: 400, description: 'Неверный код 2FA' })
  async complete2FALogin(@Body() dto: { userId: string; code: string }) {
    return this.authService.complete2FALogin(dto.userId, dto.code);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Обновление access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const accessToken = await this.authService.refreshAccessToken(dto.refreshToken);
    return { accessToken };
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Выход из системы' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  getMe(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Post('smart-auth')
  @Public()
  @ApiOperation({ 
    summary: 'Умная авторизация', 
    description: 'Автоматически определяет, нужно ли регистрировать или авторизовать пользователя. Если пользователь не существует, создает его. Если не хватает данных, запрашивает их.' 
  })
  @ApiResponse({ status: 200, description: 'Успешная авторизация или запрос дополнительных данных', type: SmartAuthResponseDto })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async smartAuth(@Body() dto: SmartAuthDto) {
    return this.authService.smartAuth(dto);
  }

  @Post('complete-info')
  @Public()
  @ApiOperation({ 
    summary: 'Дополнение информации о пользователе', 
    description: 'Дополняет недостающую информацию о пользователе (имя, фамилия)' 
  })
  @ApiResponse({ status: 200, description: 'Информация дополнена успешно', type: SmartAuthResponseDto })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async completeUserInfo(@Body() dto: { userId: string; firstName: string; lastName: string; referralCode?: string }) {
    return this.authService.completeUserInfo(dto.userId, dto.firstName, dto.lastName, dto.referralCode);
  }

  @Post('bind-phone/send-code')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Отправить SMS код для привязки телефона', 
    description: 'Отправляет SMS с кодом подтверждения на указанный номер телефона' 
  })
  @ApiResponse({ status: 200, description: 'SMS код отправлен', type: BindPhoneResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат номера телефона' })
  @ApiResponse({ status: 409, description: 'Номер уже привязан к другому аккаунту' })
  async sendPhoneVerificationCode(@Body() dto: BindPhoneDto, @CurrentUser() user: any) {
    return this.authService.sendPhoneVerificationCode(dto, user.userId);
  }

  @Post('bind-phone/verify')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Подтвердить привязку телефона', 
    description: 'Подтверждает привязку номера телефона с помощью SMS кода' 
  })
  @ApiResponse({ status: 200, description: 'Телефон успешно привязан', type: BindPhoneResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный код подтверждения' })
  async verifyPhoneCode(@Body() dto: VerifyPhoneDto, @CurrentUser() user: any) {
    return this.authService.verifyPhoneCode(dto, user.userId);
  }

  @Post('bind-phone/unbind')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Отвязать номер телефона', 
    description: 'Отвязывает номер телефона от аккаунта пользователя' 
  })
  @ApiResponse({ status: 200, description: 'Телефон отвязан успешно' })
  async unbindPhone(@CurrentUser() user: any) {
    return this.authService.unbindPhone(user.userId);
  }

  @Post('email-verification/send')
  @Public()
  @ApiOperation({ 
    summary: 'Отправить письмо подтверждения email', 
    description: 'Отправляет письмо с ссылкой для подтверждения email адреса' 
  })
  @ApiResponse({ status: 200, description: 'Письмо отправлено', type: EmailVerificationResponseDto })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 400, description: 'Email уже подтвержден' })
  async sendEmailVerification(@Body() dto: SendEmailVerificationDto) {
    return this.authService.sendEmailVerification(dto);
  }

  @Post('email-verification/verify')
  @Public()
  @ApiOperation({ 
    summary: 'Подтвердить email по токену', 
    description: 'Подтверждает email адрес по токену из письма и повышает роль пользователя' 
  })
  @ApiResponse({ status: 200, description: 'Email подтвержден', type: EmailVerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный или истекший токен' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('telegram-login')
  @Public()
  @ApiOperation({ summary: 'Обработка Telegram Login Widget' })
  @ApiResponse({ status: 200, description: 'Успешная авторизация через Telegram' })
  @ApiResponse({ status: 401, description: 'Неверные данные от Telegram' })
  async handleTelegramLogin(@Body() telegramUser: any) {
    return this.authService.handleTelegramLogin(telegramUser);
  }
}
