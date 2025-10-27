import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  /**
   * Автоматически вызывается после валидации JWT
   * Результат попадает в request.user
   */
  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Роли и права берем из JWT payload (они уже там)
    const roles = payload.roles || [];
    const permissions = payload.permissions || [];

    // Возвращаем данные, которые попадут в request.user
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      organizationId: payload.organizationId,
      teamId: payload.teamId,
      organizations: user.organizations,
      teams: user.teams,
      roles: roles,
      permissions: permissions,
    };
  }
}
