import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailAuthService } from './email-auth.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('auth-email')
@Controller('auth/email')
export class EmailAuthController {
  constructor(private emailAuthService: EmailAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход по email и паролю' })
  @ApiResponse({ status: 200, description: 'Успешная авторизация' })
  @ApiResponse({ status: 401, description: 'Неверные credentials' })
  async login(@Body() dto: LoginEmailDto) {
    return this.emailAuthService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('users.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Регистрация по email (только для админов)' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  @ApiResponse({ status: 409, description: 'Email уже существует' })
  async register(@Body() dto: RegisterEmailDto) {
    return this.emailAuthService.register(dto);
  }
}
