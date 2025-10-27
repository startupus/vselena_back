# Архитектура микромодулей Vselena

## 🎯 Цель
Создать полностью модульную систему, где каждая функция является независимым микромодулем, который можно включать/отключать через интерфейс super_admin.

## 🏗️ Структура микромодулей

### 1. Аутентификация (Auth Micro-modules)
```
src/auth/micro-modules/
├── email-auth/                    # Авторизация по email
│   ├── email-auth.module.ts
│   ├── email-auth.service.ts
│   ├── email-auth.controller.ts
│   └── dto/
│       ├── login-email.dto.ts
│       └── register-email.dto.ts
│
├── phone-auth/                    # Авторизация по телефону
│   ├── phone-auth.module.ts
│   ├── phone-auth.service.ts
│   ├── phone-auth.controller.ts
│   └── dto/
│       ├── login-phone.dto.ts
│       └── register-phone.dto.ts
│
├── social-auth/                   # Социальные сети
│   ├── social-auth.module.ts
│   ├── social-auth.service.ts
│   ├── social-auth.controller.ts
│   └── strategies/
│       ├── google.strategy.ts
│       ├── facebook.strategy.ts
│       └── vk.strategy.ts
│
└── two-factor/                   # 2FA (уже существует)
    ├── two-factor.module.ts
    ├── two-factor.service.ts
    └── two-factor.controller.ts
```

### 2. Регистрация и приглашения
```
src/auth/micro-modules/
├── invitations/                   # Система приглашений (уже существует)
│   ├── invitations.module.ts
│   ├── invitations.service.ts
│   └── invitations.controller.ts
│
└── referral-system/              # Реферальная система
    ├── referral.module.ts
    ├── referral.service.ts
    ├── referral.controller.ts
    └── entities/
        └── referral.entity.ts
```

### 3. Управление ролями и правами
```
src/rbac/micro-modules/
├── custom-roles/                 # Кастомные роли
│   ├── custom-roles.module.ts
│   ├── custom-roles.service.ts
│   └── custom-roles.controller.ts
│
├── custom-permissions/           # Кастомные права
│   ├── custom-permissions.module.ts
│   ├── custom-permissions.service.ts
│   └── custom-permissions.controller.ts
│
└── role-hierarchy/              # Иерархия ролей
    ├── role-hierarchy.module.ts
    ├── role-hierarchy.service.ts
    └── role-hierarchy.controller.ts
```

### 4. Системные настройки
```
src/settings/micro-modules/
├── system-config/               # Системная конфигурация
│   ├── system-config.module.ts
│   ├── system-config.service.ts
│   └── system-config.controller.ts
│
├── feature-management/          # Управление функциями
│   ├── feature-management.module.ts
│   ├── feature-management.service.ts
│   └── feature-management.controller.ts
│
└── ui-permissions/              # UI права доступа
    ├── ui-permissions.module.ts
    ├── ui-permissions.service.ts
    └── ui-permissions.controller.ts
```

## 🔄 Иерархия ролей

### Глобальные роли
```
super_admin (уровень 1)
├── Полный доступ ко всем функциям
├── Может настраивать систему
├── Может создавать/удалять любые роли
└── Может управлять всеми пользователями

admin (уровень 2)
├── Может создавать организации и команды
├── Может приглашать пользователей
├── Может управлять ролями admin и viewer
└── Получает все права viewer

viewer (уровень 3)
├── Только просмотр
├── Не может создавать организации/команды
└── Не может приглашать пользователей
```

### Роли команд
```
manager (в команде)
├── Может удалять editor
├── Может управлять участниками команды
└── Получает все права editor

editor (в команде)
├── Может редактировать контент команды
└── Базовые права в команде
```

## 🎛️ Настройки super_admin

### Системные настройки
- **Роль по умолчанию**: viewer | admin
- **Способы авторизации**: email, phone, social
- **Реферальная система**: включена/выключена
- **Срок приглашений**: 1-30 дней
- **2FA**: обязательная/опциональная

### Управление функциями
- **email-auth**: ✅ включена (системная)
- **phone-auth**: ❌ выключена
- **social-auth**: ❌ выключена
- **referral-system**: ✅ включена
- **custom-roles**: ✅ включена
- **custom-permissions**: ✅ включена

## 🔧 Реализация микромодулей

### Базовый интерфейс микромодуля
```typescript
interface MicroModule {
  name: string;
  version: string;
  isEnabled: boolean;
  dependencies: string[];
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getPermissions(): string[];
  getUIElements(): UIElement[];
}
```

### Регистрация микромодулей
```typescript
// В app.module.ts
const microModules = [
  EmailAuthModule,
  PhoneAuthModule,
  SocialAuthModule,
  ReferralModule,
  CustomRolesModule,
  // ... другие модули
];

// Динамическая загрузка на основе настроек
const enabledModules = await this.getEnabledModules();
```

## 🎨 UI элементы по ролям

### Система отображения
```typescript
interface UIElement {
  id: string;
  component: string;
  requiredPermissions: string[];
  requiredRoles: string[];
  conditions?: {
    featureEnabled?: string;
    userHasRole?: string;
  };
}
```

### Примеры UI элементов
```typescript
const uiElements = {
  'create-organization': {
    component: 'CreateOrganizationButton',
    requiredPermissions: ['organizations.create'],
    requiredRoles: ['admin', 'super_admin'],
  },
  'invite-user': {
    component: 'InviteUserButton',
    requiredPermissions: ['users.invite'],
    requiredRoles: ['admin', 'super_admin'],
  },
  'system-settings': {
    component: 'SystemSettingsPage',
    requiredRoles: ['super_admin'],
  },
};
```

## 📊 База данных

### Таблица микромодулей
```sql
CREATE TABLE micro_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  dependencies JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '[]',
  ui_elements JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица UI элементов
```sql
CREATE TABLE ui_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id VARCHAR(100) UNIQUE NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  required_permissions JSONB DEFAULT '[]',
  required_roles JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 План реализации

### Этап 1: Базовая структура
1. Создать базовые интерфейсы микромодулей
2. Реализовать систему регистрации модулей
3. Создать таблицы в БД

### Этап 2: Аутентификация
1. Вынести email-auth в микромодуль
2. Создать phone-auth микромодуль
3. Создать social-auth микромодуль

### Этап 3: Управление
1. Реализовать custom-roles микромодуль
2. Реализовать custom-permissions микромодуль
3. Создать систему UI элементов

### Этап 4: Настройки
1. Создать интерфейс super_admin
2. Реализовать управление функциями
3. Добавить валидацию зависимостей

## 🔍 Тестирование

### Unit тесты
- Каждый микромодуль тестируется отдельно
- Тестирование зависимостей между модулями
- Тестирование UI элементов

### Integration тесты
- Тестирование включения/выключения модулей
- Тестирование прав доступа
- Тестирование UI отображения

### E2E тесты
- Полный flow с разными ролями
- Тестирование настроек super_admin
- Тестирование всех микромодулей
