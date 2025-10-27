# Использование системы микромодулей Vselena

## 🎯 Обзор

Система микромодулей позволяет создавать полностью модульную архитектуру, где каждая функция может быть включена или отключена через интерфейс super_admin.

## 🏗️ Архитектура

### Иерархия ролей

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

## 🔧 API Endpoints

### Управление микромодулями

```bash
# Получить список всех микромодулей
GET /api/micro-modules

# Получить включенные микромодули
GET /api/micro-modules/enabled

# Получить UI элементы для пользователя
GET /api/micro-modules/ui-elements

# Получить статистику (только super_admin)
GET /api/micro-modules/stats

# Включить микромодуль (только super_admin)
POST /api/micro-modules/:moduleName/enable

# Отключить микромодуль (только super_admin)
POST /api/micro-modules/:moduleName/disable
```

### Настройки super_admin

```bash
# Получить системные настройки
GET /api/super-admin/system-settings

# Обновить системную настройку
PUT /api/super-admin/system-settings/:key

# Получить настройки функций
GET /api/super-admin/feature-settings

# Включить/отключить функцию
POST /api/super-admin/features/:featureName/toggle

# Получить иерархию ролей
GET /api/super-admin/role-hierarchy

# Получить роль по умолчанию
GET /api/super-admin/default-user-role

# Установить роль по умолчанию
PUT /api/super-admin/default-user-role

# Получить доступные способы авторизации
GET /api/super-admin/auth-methods

# Инициализировать настройки
POST /api/super-admin/initialize
```

### UI элементы

```bash
# Получить UI элементы для пользователя
GET /api/ui-permissions/elements

# Получить навигационное меню
GET /api/ui-permissions/navigation/:menuId

# Создать UI элемент (только super_admin)
POST /api/ui-permissions/elements

# Обновить UI элемент (только super_admin)
PUT /api/ui-permissions/elements/:elementId

# Удалить UI элемент (только super_admin)
DELETE /api/ui-permissions/elements/:elementId
```

## 🎨 Создание нового микромодуля

### 1. Создание структуры

```bash
mkdir -p src/your-module/micro-modules/your-feature
cd src/your-module/micro-modules/your-feature
```

### 2. Создание микромодуля

```typescript
// your-feature.micro-module.ts
import { Injectable } from '@nestjs/common';
import { BaseMicroModule } from '../../../../common/base/base-micro-module';
import { UIElement } from '../../../../common/interfaces/ui-element.interface';

@Injectable()
export class YourFeatureMicroModule extends BaseMicroModule {
  readonly name = 'your-feature';
  readonly version = '1.0.0';
  readonly displayName = 'Ваша функция';
  readonly description = 'Описание вашей функции';
  readonly isEnabled = true;
  readonly isSystem = false;
  readonly dependencies = [];
  readonly permissions = [
    'your-feature.create',
    'your-feature.read',
    'your-feature.update',
    'your-feature.delete',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'your-feature-form',
      component: 'YourFeatureForm',
      path: '/your-feature',
      displayName: 'Форма вашей функции',
      description: 'Форма для работы с вашей функцией',
      requiredPermissions: ['your-feature.create'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'your-feature',
      },
      priority: 100,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'your-category',
      },
    },
  ];
  readonly priority = 50;

  protected async onInitialize(): Promise<void> {
    console.log('Your feature module initialized');
  }

  protected async onDestroy(): Promise<void> {
    console.log('Your feature module destroyed');
  }
}
```

### 3. Создание модуля

```typescript
// your-feature.module.ts
import { Module } from '@nestjs/common';
import { YourFeatureMicroModule } from './your-feature.micro-module';
import { YourFeatureService } from './your-feature.service';
import { YourFeatureController } from './your-feature.controller';

@Module({
  controllers: [YourFeatureController],
  providers: [YourFeatureService, YourFeatureMicroModule],
  exports: [YourFeatureService, YourFeatureMicroModule],
})
export class YourFeatureModule {}
```

### 4. Регистрация в app.module.ts

```typescript
// app.module.ts
import { YourFeatureModule } from './your-module/micro-modules/your-feature/your-feature.module';

@Module({
  imports: [
    // ... другие модули
    YourFeatureModule,
  ],
})
export class AppModule {}
```

## 🔍 Тестирование микромодулей

### Unit тесты

```typescript
// your-feature.micro-module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { YourFeatureMicroModule } from './your-feature.micro-module';

describe('YourFeatureMicroModule', () => {
  let module: YourFeatureMicroModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourFeatureMicroModule],
    }).compile();

    module = module.get<YourFeatureMicroModule>(YourFeatureMicroModule);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should initialize correctly', async () => {
    await expect(module.initialize()).resolves.not.toThrow();
  });

  it('should destroy correctly', async () => {
    await expect(module.destroy()).resolves.not.toThrow();
  });
});
```

### Integration тесты

```typescript
// micro-modules.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MicroModuleRegistryService } from '../common/services/micro-module-registry.service';

describe('MicroModules (e2e)', () => {
  let app: INestApplication;
  let registryService: MicroModuleRegistryService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    registryService = app.get<MicroModuleRegistryService>(MicroModuleRegistryService);
  });

  it('/micro-modules (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/micro-modules')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });
});
```

## 📊 Мониторинг и отладка

### Логи микромодулей

```typescript
// В каждом микромодуле
protected async onInitialize(): Promise<void> {
  this.logger.log(`Инициализация модуля ${this.name}`);
  // Ваша логика инициализации
}

protected async onDestroy(): Promise<void> {
  this.logger.log(`Остановка модуля ${this.name}`);
  // Ваша логика очистки
}
```

### Статистика модулей

```bash
# Получить статистику
curl -X GET "http://localhost:3001/api/micro-modules/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ:
```json
{
  "total": 5,
  "enabled": 4,
  "disabled": 1,
  "system": 2,
  "custom": 3
}
```

## 🚀 Развертывание

### 1. Инициализация настроек

```bash
# Инициализировать системные настройки
curl -X POST "http://localhost:3001/api/super-admin/initialize" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### 2. Настройка функций

```bash
# Включить телефонную авторизацию
curl -X POST "http://localhost:3001/api/super-admin/features/phone-auth/toggle" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureName": "phone-auth", "isEnabled": true}'

# Включить реферальную систему
curl -X POST "http://localhost:3001/api/super-admin/features/referral-system/toggle" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureName": "referral-system", "isEnabled": true}'
```

### 3. Настройка роли по умолчанию

```bash
# Установить роль по умолчанию
curl -X PUT "http://localhost:3001/api/super-admin/default-user-role" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "viewer"}'
```

## 🔧 Конфигурация

### Переменные окружения

```env
# .env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=vselena
DB_PASSWORD=vselena_secret
DB_DATABASE=vselena_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars-long
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars-long-very-secure
JWT_REFRESH_EXPIRATION=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Swagger
SWAGGER_ENABLED=true
```

## 📚 Дополнительные ресурсы

- [Архитектура микромодулей](./MICROMODULES_ARCHITECTURE.md)
- [API документация](http://localhost:3001/api/docs)
- [Swagger UI](http://localhost:3001/api/docs)

## 🐛 Отладка

### Проверка состояния модулей

```bash
# Получить все модули
curl -X GET "http://localhost:3001/api/micro-modules"

# Получить включенные модули
curl -X GET "http://localhost:3001/api/micro-modules/enabled"

# Получить UI элементы
curl -X GET "http://localhost:3001/api/micro-modules/ui-elements" \
  -H "Authorization: Bearer USER_TOKEN"
```

### Логи

```bash
# Просмотр логов
docker-compose logs -f backend

# Фильтрация логов микромодулей
docker-compose logs -f backend | grep "MicroModule"
```
