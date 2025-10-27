import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogData {
  userId: string;
  service: string;
  action: string;
  resource?: string;
  resourceId?: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  userRoles: string[];
  userPermissions: string[];
  organizationId?: string;
  teamId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * Создание записи аудита
   */
  async log(data: AuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepo.create({
      userId: data.userId,
      service: data.service,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      requestData: data.requestData,
      responseData: data.responseData,
      statusCode: data.statusCode || 200,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      userRoles: data.userRoles,
      userPermissions: data.userPermissions,
      organizationId: data.organizationId,
      teamId: data.teamId,
    });

    return this.auditLogRepo.save(auditLog);
  }

  /**
   * Получение истории действий пользователя
   */
  async getUserAuditHistory(
    userId: string,
    page: number = 1,
    limit: number = 50,
    service?: string,
    action?: string,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const query = this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC');

    if (service) {
      query.andWhere('audit.service = :service', { service });
    }

    if (action) {
      query.andWhere('audit.action = :action', { action });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Получение дерева сервисов для пользователя
   */
  async getUserServiceTree(userId: string): Promise<any> {
    const auditLogs = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    // Группируем по сервисам
    const serviceMap = new Map<string, any>();

    auditLogs.forEach(log => {
      if (!serviceMap.has(log.service)) {
        serviceMap.set(log.service, {
          service: log.service,
          totalActions: 0,
          lastAccess: log.createdAt,
          actions: new Map<string, any>(),
          roles: new Set<string>(),
          permissions: new Set<string>(),
        });
      }

      const serviceData = serviceMap.get(log.service);
      serviceData.totalActions++;
      serviceData.lastAccess = log.createdAt;

      // Добавляем роли и права
      log.userRoles.forEach(role => serviceData.roles.add(role));
      log.userPermissions.forEach(permission => serviceData.permissions.add(permission));

      // Группируем по действиям
      if (!serviceData.actions.has(log.action)) {
        serviceData.actions.set(log.action, {
          action: log.action,
          count: 0,
          lastUsed: log.createdAt,
          resources: new Set<string>(),
        });
      }

      const actionData = serviceData.actions.get(log.action);
      if (actionData) {
        actionData.count++;
        actionData.lastUsed = log.createdAt;
        if (log.resource) {
          actionData.resources.add(log.resource);
        }
      }
    });

    // Преобразуем в дерево
    const serviceTree = Array.from(serviceMap.values()).map(service => ({
      service: service.service,
      totalActions: service.totalActions,
      lastAccess: service.lastAccess,
      roles: Array.from(service.roles),
      permissions: Array.from(service.permissions),
      actions: Array.from(service.actions.values()).map((action: any) => ({
        action: action.action,
        count: action.count,
        lastUsed: action.lastUsed,
        resources: Array.from(action.resources),
      })),
    }));

    return serviceTree;
  }

  /**
   * Получение статистики по сервисам
   */
  async getServiceStatistics(userId: string): Promise<any> {
    const stats = await this.auditLogRepo
      .createQueryBuilder('audit')
      .select([
        'audit.service',
        'COUNT(*) as total_actions',
        'COUNT(DISTINCT audit.action) as unique_actions',
        'MAX(audit.createdAt) as last_access',
        'MIN(audit.createdAt) as first_access',
      ])
      .where('audit.userId = :userId', { userId })
      .groupBy('audit.service')
      .orderBy('total_actions', 'DESC')
      .getRawMany();

    return stats;
  }

  /**
   * Получение истории ролей пользователя
   */
  async getUserRoleHistory(userId: string): Promise<any> {
    const roleHistory = await this.auditLogRepo
      .createQueryBuilder('audit')
      .select([
        'audit.userRoles',
        'audit.userPermissions',
        'audit.service',
        'audit.action',
        'audit.createdAt',
      ])
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    // Группируем по уникальным комбинациям ролей
    const roleMap = new Map<string, any>();

    roleHistory.forEach(log => {
      const roleKey = JSON.stringify(log.userRoles.sort());
      if (!roleMap.has(roleKey)) {
        roleMap.set(roleKey, {
          roles: log.userRoles,
          permissions: log.userPermissions,
          firstSeen: log.createdAt,
          lastSeen: log.createdAt,
          services: new Set<string>(),
          actions: new Set<string>(),
        });
      }

      const roleData = roleMap.get(roleKey);
      roleData.lastSeen = log.createdAt;
      roleData.services.add(log.service);
      roleData.actions.add(log.action);
    });

    return Array.from(roleMap.values()).map(role => ({
      roles: role.roles,
      permissions: role.permissions,
      firstSeen: role.firstSeen,
      lastSeen: role.lastSeen,
      services: Array.from(role.services),
      actions: Array.from(role.actions),
    }));
  }
}
