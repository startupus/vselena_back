import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../email.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailCodeService {
  private emailCodes = new Map<string, { code: string; email: string; expiresAt: Date }>();

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendLoginCode(email: string): Promise<{ message: string }> {
    // Находим пользователя по email
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.role.permissions'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Сохраняем код в памяти (в production лучше использовать Redis)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут
    this.emailCodes.set(code, { code, email, expiresAt });

    // Отправляем код на почту
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Код для входа в Loginus',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Код для входа в Loginus</h2>
            <p>Здравствуйте, ${user.firstName || 'Пользователь'}!</p>
            <p>Ваш код для входа в систему:</p>
            <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">${code}</span>
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не запрашивали код для входа, проигнорируйте это письмо.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px;">С уважением,<br>Команда Loginus</p>
          </div>
        `,
      });

      return { message: 'Код отправлен на вашу почту' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new BadRequestException('Ошибка отправки кода на почту');
    }
  }

  async loginWithCode(code: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // Проверяем код
    const codeData = this.emailCodes.get(code);
    
    if (!codeData) {
      throw new BadRequestException('Неверный код');
    }

    if (codeData.expiresAt < new Date()) {
      this.emailCodes.delete(code);
      throw new BadRequestException('Код истек');
    }

    // Находим пользователя
    const user = await this.usersRepo.findOne({
      where: { email: codeData.email },
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.role.permissions', 'organizations', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Удаляем использованный код
    this.emailCodes.delete(code);

    // Генерируем токены
    const permissions = this.extractPermissions(user.userRoleAssignments);
    
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizations?.[0]?.id || null,
      teamId: user.teams?.[0]?.id || null,
      roles: user.userRoleAssignments?.map(a => a.role?.name).filter(Boolean) || [],
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
    });

    const refreshToken = crypto.randomUUID();
    
    // Сохраняем refresh token (в production лучше использовать БД)
    // Здесь упрощенно - в реальном проекте нужно сохранить в БД

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizations?.[0]?.id || null,
        teamId: user.teams?.[0]?.id || null,
        roles: user.userRoleAssignments?.map(a => a.role?.name).filter(Boolean) || [],
        permissions,
      },
    };
  }

  private extractPermissions(userRoleAssignments: any[]): string[] {
    const permissions = new Set<string>();
    
    userRoleAssignments?.forEach(assignment => {
      if (assignment.role?.permissions) {
        assignment.role.permissions.forEach(perm => {
          permissions.add(perm.name);
        });
      }
    });

    return Array.from(permissions);
  }
}
