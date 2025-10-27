import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../users/entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { PermissionsUtilsService } from '../../../common/services/permissions-utils.service';

@Injectable()
export class EmailAuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private permissionsUtils: PermissionsUtilsService,
  ) {}

  /**
   * Вход по email и паролю
   */
  async login(dto: LoginEmailDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const user = await this.validateUser(dto.email, dto.password);
    
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Регистрация по email
   */
  async register(dto: RegisterEmailDto): Promise<Partial<User>> {
    // Проверка уникальности email
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email уже используется');
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Создание пользователя
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const savedUser = await this.usersRepo.save(user);
    return this.sanitizeUser(Array.isArray(savedUser) ? savedUser[0] : savedUser);
  }

  /**
   * Валидация пользователя
   */
  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'isActive', 'emailVerified'],
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return user;
  }

  /**
   * Генерация Access Token
   */
  private async generateAccessToken(user: User): Promise<string> {
    const permissions = this.permissionsUtils.extractUserPermissions(user);
    const roles = user.userRoleAssignments?.map(assignment => assignment.role?.name) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizations?.[0]?.id || null,
      teamId: user.teams?.[0]?.id || null,
      roles,
      permissions,
    };

    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  /**
   * Генерация Refresh Token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

    await this.refreshTokensRepo.save({
      token,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return token;
  }

  /**
   * Извлечение прав из ролей
   */

  /**
   * Удаление чувствительных данных
   */
  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
