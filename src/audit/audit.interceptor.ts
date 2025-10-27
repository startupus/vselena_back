import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = (request as any).user;

    // Пропускаем публичные endpoints
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logSuccess(request, response, user, data, startTime);
        },
        error: (error) => {
          this.logError(request, response, user, error, startTime);
        },
      }),
    );
  }

  private async logSuccess(
    request: Request,
    response: Response,
    user: any,
    data: any,
    startTime: number,
  ) {
    try {
      const service = this.extractService(request.url);
      const action = this.extractAction(request.method, request.url);
      const resource = this.extractResource(request.url);

      await this.auditService.log({
        userId: user.userId,
        service,
        action,
        resource,
        resourceId: this.extractResourceId(request.url),
        requestData: this.sanitizeRequestData(request),
        responseData: this.sanitizeResponseData(data),
        statusCode: response.statusCode,
        ipAddress: this.getClientIp(request),
        userAgent: request.get('User-Agent'),
        userRoles: user.roles || [],
        userPermissions: user.permissions || [],
        organizationId: user.organizations?.[0]?.id || null,
        teamId: user.teams?.[0]?.id || null,
      });
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  private async logError(
    request: Request,
    response: Response,
    user: any,
    error: any,
    startTime: number,
  ) {
    try {
      const service = this.extractService(request.url);
      const action = this.extractAction(request.method, request.url);
      const resource = this.extractResource(request.url);

      await this.auditService.log({
        userId: user.userId,
        service,
        action,
        resource,
        resourceId: this.extractResourceId(request.url),
        requestData: this.sanitizeRequestData(request),
        responseData: { error: error.message },
        statusCode: error.status || 500,
        ipAddress: this.getClientIp(request),
        userAgent: request.get('User-Agent'),
        userRoles: user.roles || [],
        userPermissions: user.permissions || [],
        organizationId: user.organizations?.[0]?.id || null,
        teamId: user.teams?.[0]?.id || null,
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }
  }

  private extractService(url: string): string {
    const parts = url.split('/').filter(part => part);
    if (parts.length >= 2) {
      return parts[1]; // /api/auth -> auth, /api/users -> users
    }
    return 'unknown';
  }

  private extractAction(method: string, url: string): string {
    const methodMap = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    // Специальные случаи
    if (url.includes('/login')) return 'login';
    if (url.includes('/logout')) return 'logout';
    if (url.includes('/refresh')) return 'refresh';
    if (url.includes('/me')) return 'get_profile';

    return methodMap[method] || 'unknown';
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter(part => part);
    if (parts.length >= 2) {
      return parts[1]; // /api/users -> users
    }
    return 'unknown';
  }

  private extractResourceId(url: string): string | undefined {
    const parts = url.split('/').filter(part => part);
    // Ищем UUID в URL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const part of parts) {
      if (uuidRegex.test(part)) {
        return part;
      }
    }
    return undefined;
  }

  private sanitizeRequestData(request: Request): any {
    const data: any = {
      method: request.method,
      url: request.url,
      query: request.query,
    };

    // Добавляем body только для POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      data.body = request.body;
    }

    // Удаляем чувствительные данные
    if (data.body && data.body.password) {
      data.body.password = '[REDACTED]';
    }

    return data;
  }

  private sanitizeResponseData(data: any): any {
    if (!data) return data;

    // Ограничиваем размер ответа
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 10000) {
      return { message: 'Response too large for audit log' };
    }

    return data;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
