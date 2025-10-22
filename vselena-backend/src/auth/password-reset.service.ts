import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from './email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetTokensRepo: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Запрос восстановления пароля
   */
  async requestPasswordReset(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;

    // 1. Проверяем, существует ли пользователь
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'lastName'],
    });

    if (!user) {
      // Для безопасности не сообщаем, что пользователь не найден
      return {
        message: 'Если пользователь с таким email существует, на него будет отправлена ссылка для восстановления пароля',
      };
    }

    // 2. Отзываем все предыдущие токены для этого пользователя
    await this.passwordResetTokensRepo.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() }
    );

    // 3. Генерируем новый токен
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 минут

    // 4. Сохраняем токен в БД
    await this.passwordResetTokensRepo.save({
      userId: user.id,
      token,
      expiresAt,
    });

    // 5. Формируем ссылку для восстановления
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3002');
    const resetLink = `${frontendUrl}/reset-password.html?token=${token}`;

    // 6. Отправляем email
    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    console.log(`🔐 Запрос восстановления пароля для ${email}`);
    console.log(`   Токен: ${token}`);
    console.log(`   Ссылка: ${resetLink}`);

    return {
      message: 'Если пользователь с таким email существует, на него будет отправлена ссылка для восстановления пароля',
    };
  }

  /**
   * Проверка валидности токена восстановления
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; user?: any }> {
    const resetToken = await this.passwordResetTokensRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      return { valid: false };
    }

    // Проверяем, не истек ли токен
    if (resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    // Проверяем, не использован ли токен
    if (resetToken.usedAt) {
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: resetToken.user.id,
        email: resetToken.user.email,
        firstName: resetToken.user.firstName,
        lastName: resetToken.user.lastName,
      },
    };
  }

  /**
   * Сброс пароля по токену
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    // 1. Проверяем валидность токена
    const tokenValidation = await this.validateResetToken(token);
    if (!tokenValidation.valid) {
      throw new BadRequestException('Недействительный или истекший токен восстановления');
    }

    // 2. Находим токен в БД
    const resetToken = await this.passwordResetTokensRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Токен не найден');
    }

    // 3. Хешируем новый пароль
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 4. Обновляем пароль пользователя
    await this.usersRepo.update(resetToken.userId, {
      passwordHash,
    });

    // 5. Помечаем токен как использованный
    await this.passwordResetTokensRepo.update(resetToken.id, {
      usedAt: new Date(),
    });

    // 6. Отзываем все остальные токены пользователя
    await this.passwordResetTokensRepo.update(
      { userId: resetToken.userId, usedAt: IsNull() },
      { usedAt: new Date() }
    );

    console.log(`🔐 Пароль успешно сброшен для пользователя ${resetToken.user.email}`);

    return {
      message: 'Пароль успешно изменен. Теперь вы можете войти в систему с новым паролем',
    };
  }

  /**
   * Очистка истекших токенов (для cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.passwordResetTokensRepo.delete({
      expiresAt: new Date(),
    });

    if (result.affected && result.affected > 0) {
      console.log(`🧹 Очищено ${result.affected} истекших токенов восстановления пароля`);
    }
  }
}
