import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('password-reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Запрос восстановления пароля',
    description: 'Отправляет ссылку для восстановления пароля на email пользователя'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ссылка для восстановления пароля отправлена (если пользователь существует)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Если пользователь с таким email существует, на него будет отправлена ссылка для восстановления пароля'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Некорректные данные запроса' 
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.requestPasswordReset(dto);
  }

  @Get('validate-token')
  @Public()
  @ApiOperation({ 
    summary: 'Проверка валидности токена восстановления',
    description: 'Проверяет, действителен ли токен восстановления пароля'
  })
  @ApiQuery({ 
    name: 'token', 
    description: 'Токен восстановления пароля',
    example: 'abc123def456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Результат проверки токена',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          example: true
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        }
      }
    }
  })
  async validateToken(@Query('token') token: string) {
    return this.passwordResetService.validateResetToken(token);
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Сброс пароля по токену',
    description: 'Устанавливает новый пароль пользователя по токену восстановления'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Пароль успешно изменен',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Пароль успешно изменен. Теперь вы можете войти в систему с новым паролем'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Недействительный или истекший токен' 
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}
