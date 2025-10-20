import { SYSTEM_PERMISSIONS } from './permissions.seed';

export const SYSTEM_ROLES = [
  // ========================================
  // 1. SUPER ADMIN (полный доступ)
  // ========================================
  {
    name: 'super_admin',
    description: 'Суперадминистратор с полным доступом',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.name), // ВСЕ 28 прав
  },

  // ========================================
  // 2. ADMIN (администратор организации)
  // ========================================
  {
    name: 'admin',
    description: 'Администратор организации',
    isSystem: true,
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'knowledge.create', 'knowledge.read', 'knowledge.update', 'knowledge.delete',
      'knowledge.approve', 'knowledge.publish',
      'clients.create', 'clients.read', 'clients.update', 'clients.delete', 'clients.export',
      'settings.read', 'settings.update', 'settings.integrations',
      'support.tickets.read', 'support.tickets.update', 'support.tickets.assign', 'support.chat',
      'organizations.create', 'organizations.read', 'organizations.update', 'organizations.delete', 'organizations.members',
      'teams.create', 'teams.read', 'teams.update', 'teams.delete', 'teams.members',
      'teams.create_standalone', 'teams.create_organization',
      'roles.create', 'roles.update', 'roles.delete', 'roles.assign',
    ],
  },

  // ========================================
  // 3. MANAGER (менеджер команды)
  // ========================================
  {
    name: 'manager',
    description: 'Менеджер команды',
    isSystem: true,
    permissions: [
      'users.read', 'users.update',
      'knowledge.create', 'knowledge.read', 'knowledge.update', 'knowledge.approve',
      'clients.create', 'clients.read', 'clients.update',
      'settings.read',
      'support.tickets.read', 'support.tickets.update', 'support.tickets.assign', 'support.chat',
      'organizations.read', // Может только просматривать организации
      'teams.create', 'teams.read', 'teams.update', 'teams.delete', 'teams.members', // Полные права на команды
      'teams.create_organization', // Может создавать команды внутри организации
    ],
  },

  // ========================================
  // 4. EDITOR (редактор контента)
  // ========================================
  {
    name: 'editor',
    description: 'Редактор контента',
    isSystem: true,
    permissions: [
      'users.read',
      'knowledge.create', 'knowledge.read', 'knowledge.update',
      'clients.read', 'clients.update',
      'support.tickets.read', 'support.chat',
      'organizations.read', // Может только просматривать организации
      'teams.read', // Может только просматривать команды
    ],
  },

  // ========================================
  // 5. VIEWER (только просмотр)
  // ========================================
  {
    name: 'viewer',
    description: 'Просмотр без возможности редактирования',
    isSystem: true,
    permissions: [
      'users.read',
      'knowledge.read',
      'clients.read',
      'support.tickets.read',
      'organizations.read', // Может только просматривать организации
      'teams.read', // Может только просматривать команды
    ],
  },
];
