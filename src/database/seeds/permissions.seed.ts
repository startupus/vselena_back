export const SYSTEM_PERMISSIONS = [
  // ========== USERS ==========
  {
    name: 'users.create',
    resource: 'users',
    action: 'create',
    description: 'Создание пользователей',
  },
  {
    name: 'users.read',
    resource: 'users',
    action: 'read',
    description: 'Просмотр пользователей',
  },
  {
    name: 'users.update',
    resource: 'users',
    action: 'update',
    description: 'Редактирование пользователей',
  },
  {
    name: 'users.delete',
    resource: 'users',
    action: 'delete',
    description: 'Удаление пользователей',
  },

  // ========== KNOWLEDGE BASE ==========
  {
    name: 'knowledge.create',
    resource: 'knowledge',
    action: 'create',
    description: 'Создание материалов базы знаний',
  },
  {
    name: 'knowledge.read',
    resource: 'knowledge',
    action: 'read',
    description: 'Просмотр материалов базы знаний',
  },
  {
    name: 'knowledge.update',
    resource: 'knowledge',
    action: 'update',
    description: 'Редактирование материалов',
  },
  {
    name: 'knowledge.delete',
    resource: 'knowledge',
    action: 'delete',
    description: 'Удаление материалов',
  },
  {
    name: 'knowledge.approve',
    resource: 'knowledge',
    action: 'approve',
    description: 'Одобрение материалов',
  },
  {
    name: 'knowledge.publish',
    resource: 'knowledge',
    action: 'publish',
    description: 'Публикация материалов',
  },

  // ========== CLIENTS (CRM) ==========
  {
    name: 'clients.create',
    resource: 'clients',
    action: 'create',
    description: 'Создание клиентов',
  },
  {
    name: 'clients.read',
    resource: 'clients',
    action: 'read',
    description: 'Просмотр клиентов',
  },
  {
    name: 'clients.update',
    resource: 'clients',
    action: 'update',
    description: 'Редактирование данных клиентов',
  },
  {
    name: 'clients.delete',
    resource: 'clients',
    action: 'delete',
    description: 'Удаление клиентов',
  },
  {
    name: 'clients.export',
    resource: 'clients',
    action: 'export',
    description: 'Экспорт данных клиентов',
  },

  // ========== SETTINGS ==========
  {
    name: 'settings.read',
    resource: 'settings',
    action: 'read',
    description: 'Просмотр настроек',
  },
  {
    name: 'settings.update',
    resource: 'settings',
    action: 'update',
    description: 'Изменение настроек',
  },
  {
    name: 'settings.integrations',
    resource: 'settings',
    action: 'integrations',
    description: 'Управление интеграциями',
  },

  // ========== SUPPORT ==========
  {
    name: 'support.tickets.read',
    resource: 'support',
    action: 'read',
    description: 'Просмотр тикетов поддержки',
  },
  {
    name: 'support.tickets.update',
    resource: 'support',
    action: 'update',
    description: 'Обновление тикетов',
  },
  {
    name: 'support.tickets.assign',
    resource: 'support',
    action: 'assign',
    description: 'Назначение тикетов',
  },
  {
    name: 'support.chat',
    resource: 'support',
    action: 'chat',
    description: 'Доступ к чату поддержки',
  },

  // ========== ORGANIZATIONS ==========
  {
    name: 'organizations.create',
    resource: 'organizations',
    action: 'create',
    description: 'Создание организаций',
  },
  {
    name: 'organizations.read',
    resource: 'organizations',
    action: 'read',
    description: 'Просмотр организаций',
  },
  {
    name: 'organizations.update',
    resource: 'organizations',
    action: 'update',
    description: 'Редактирование организаций',
  },
  {
    name: 'organizations.delete',
    resource: 'organizations',
    action: 'delete',
    description: 'Удаление организаций',
  },
  {
    name: 'organizations.members',
    resource: 'organizations',
    action: 'members',
    description: 'Управление участниками организаций',
  },

  // ========== TEAMS ==========
  {
    name: 'teams.create',
    resource: 'teams',
    action: 'create',
    description: 'Создание команд (внутри организации или самостоятельных)',
  },
  {
    name: 'teams.read',
    resource: 'teams',
    action: 'read',
    description: 'Просмотр команд',
  },
  {
    name: 'teams.update',
    resource: 'teams',
    action: 'update',
    description: 'Редактирование команд',
  },
  {
    name: 'teams.delete',
    resource: 'teams',
    action: 'delete',
    description: 'Удаление команд',
  },
  {
    name: 'teams.members',
    resource: 'teams',
    action: 'members',
    description: 'Управление участниками команд',
  },
  {
    name: 'teams.create_standalone',
    resource: 'teams',
    action: 'create_standalone',
    description: 'Создание самостоятельных команд (не привязанных к организации)',
  },
  {
    name: 'teams.create_organization',
    resource: 'teams',
    action: 'create_organization',
    description: 'Создание команд внутри организации',
  },

  // ========== ROLES ==========
  {
    name: 'roles.create',
    resource: 'roles',
    action: 'create',
    description: 'Создание ролей',
  },
  {
    name: 'roles.update',
    resource: 'roles',
    action: 'update',
    description: 'Редактирование ролей',
  },
  {
    name: 'roles.delete',
    resource: 'roles',
    action: 'delete',
    description: 'Удаление ролей',
  },
  {
    name: 'roles.assign',
    resource: 'roles',
    action: 'assign',
    description: 'Назначение ролей пользователям',
  },
];
