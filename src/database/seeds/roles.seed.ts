import { SYSTEM_PERMISSIONS } from './permissions.seed';

// Глобальные роли (применяются ко всей системе)
export const GLOBAL_ROLES = [
  // ========================================
  // 1. SUPER ADMIN (полный доступ)
  // ========================================
  {
    name: 'super_admin',
    description: 'Суперадминистратор с полным доступом',
    isSystem: true,
    isGlobal: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.name), // ВСЕ права
  },

  // ========================================
  // 2. ADMIN (администратор организации)
  // ========================================
  {
    name: 'admin',
    description: 'Администратор организации',
    isSystem: true,
    isGlobal: true,
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
  // 3. VIEWER (только просмотр)
  // ========================================
  {
    name: 'viewer',
    description: 'Просмотр без возможности редактирования',
    isSystem: true,
    isGlobal: true,
    permissions: [
      'users.read',
      'knowledge.read',
      'clients.read',
      'support.tickets.read',
      'organizations.read',
      'teams.read',
    ],
  },
];

// Роли команд (применяются только в рамках команды)
export const TEAM_ROLES = [
  // ========================================
  // 1. MANAGER (менеджер команды)
  // ========================================
  {
    name: 'team_manager',
    description: 'Менеджер команды',
    isSystem: true,
    isGlobal: false,
    permissions: [
      'users.read', 'users.update',
      'knowledge.create', 'knowledge.read', 'knowledge.update', 'knowledge.approve',
      'clients.create', 'clients.read', 'clients.update',
      'settings.read',
      'support.tickets.read', 'support.tickets.update', 'support.tickets.assign', 'support.chat',
      'teams.members',
    ],
  },

  // ========================================
  // 2. EDITOR (редактор контента)
  // ========================================
  {
    name: 'team_editor',
    description: 'Редактор контента',
    isSystem: true,
    isGlobal: false,
    permissions: [
      'users.read',
      'knowledge.create', 'knowledge.read', 'knowledge.update',
      'clients.read', 'clients.update',
      'support.tickets.read', 'support.chat',
    ],
  },

  // ========================================
  // 3. AUTHOR (автор контента)
  // ========================================
  {
    name: 'team_author',
    description: 'Автор контента',
    isSystem: true,
    isGlobal: false,
    permissions: [
      'knowledge.create', 'knowledge.read', 'knowledge.update',
      'clients.read',
      'support.tickets.read',
    ],
  },

  // ========================================
  // 4. SUPPORT (поддержка клиентов)
  // ========================================
  {
    name: 'team_support',
    description: 'Специалист поддержки',
    isSystem: true,
    isGlobal: false,
    permissions: [
      'clients.read', 'clients.update',
      'support.tickets.read', 'support.tickets.update', 'support.chat',
    ],
  },

  // ========================================
  // 5. VIEWER (просмотрщик)
  // ========================================
  {
    name: 'team_viewer',
    description: 'Просмотрщик команды',
    isSystem: true,
    isGlobal: false,
    permissions: [
      'knowledge.read',
      'clients.read',
      'support.tickets.read',
    ],
  },
];

// Объединяем все роли для обратной совместимости
export const SYSTEM_ROLES = [...GLOBAL_ROLES, ...TEAM_ROLES];