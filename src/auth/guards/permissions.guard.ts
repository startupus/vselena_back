import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Нет требований к правам
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Проверяем, есть ли хотя бы одно из требуемых прав
    return requiredPermissions.some(permission =>
      user.permissions?.includes(permission)
    );
  }
}
