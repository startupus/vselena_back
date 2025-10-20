# 🔧 Система микромодулей аутентификации

## 📋 Обзор

Система микромодулей позволяет создавать модульную архитектуру аутентификации, где каждый функционал (2FA, повышение ролей, социальные сети) вынесен в отдельный микромодуль. Это обеспечивает:

- ✅ **Гибкость**: легко добавлять/удалять функции
- ✅ **Масштабируемость**: независимые модули
- ✅ **Тестируемость**: изолированное тестирование
- ✅ **Переиспользование**: модули можно использовать в других проектах

## 🏗️ Архитектура

```
micro-modules/
├── base/                           # Базовые интерфейсы и классы
│   ├── auth-micro-module.interface.ts
│   ├── auth-micro-module.abstract.ts
│   └── role-promotion.interface.ts
├── two-factor/                     # 2FA микромодули
│   ├── email/
│   ├── sms/
│   └── telegram/
├── role-promotion/                 # Микромодули повышения ролей
│   ├── email-verification/
│   ├── phone-verification/
│   └── two-factor/
├── manager/                        # Управление микромодулями
│   ├── micro-module-manager.service.ts
│   └── micro-module-manager.controller.ts
└── micro-modules.module.ts         # Главный модуль
```

## 🎯 Типы микромодулей

### 1. **Two-Factor Authentication (2FA)**
- **Email 2FA**: отправка кодов на email
- **SMS 2FA**: отправка кодов через SMS
- **Telegram 2FA**: отправка кодов через Telegram Bot

### 2. **Role Promotion (Повышение ролей)**
- **Email Verification**: повышение при подтверждении email
- **Phone Verification**: повышение при подтверждении телефона
- **Two-Factor**: повышение при включении 2FA

### 3. **Social Authentication** (планируется)
- **VK**: авторизация через ВКонтакте
- **Google**: авторизация через Google
- **Yandex**: авторизация через Яндекс

## 🚀 Использование

### Подключение всех микромодулей
```typescript
// В auth.module.ts
import { MicroModulesModule } from './micro-modules/micro-modules.module';

@Module({
  imports: [
    // ... другие импорты
    MicroModulesModule.forRoot(), // Все микромодули
  ],
})
export class AuthModule {}
```

### Подключение выборочных микромодулей
```typescript
// Подключить только email 2FA и email verification
MicroModulesModule.forFeature([
  'email-2fa',
  'email-verification-promotion'
])
```

## 📊 API для управления микромодулями

### Получить статистику
```http
GET /api/micro-modules/stats
```

### Список всех микромодулей
```http
GET /api/micro-modules/list
```

### Список микромодулей повышения ролей
```http
GET /api/micro-modules/role-promotion
```

### Информация о конкретном модуле
```http
GET /api/micro-modules/{moduleName}
```

### Отключить модуль
```http
DELETE /api/micro-modules/{moduleName}
```

## 🔧 Создание нового микромодуля

### 1. Создайте интерфейс микромодуля
```typescript
// my-feature-micro-module.interface.ts
export interface MyFeatureMicroModule extends IAuthMicroModule {
  type: 'my-feature';
  config: {
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    enabled: boolean;
    priority: number;
  };
}
```

### 2. Создайте сервис
```typescript
// my-feature.service.ts
@Injectable()
export class MyFeatureService {
  // Ваша логика
}
```

### 3. Создайте контроллер
```typescript
// my-feature.controller.ts
@Controller('my-feature')
export class MyFeatureController {
  constructor(private readonly myFeatureService: MyFeatureService) {}
  
  // Ваши endpoints
}
```

### 4. Создайте микромодуль
```typescript
// my-feature-micro-module.ts
export class MyFeatureMicroModule implements MyFeatureMicroModule {
  type = 'my-feature' as const;
  
  config = {
    name: 'my-feature',
    version: '1.0.0',
    description: 'Мой функционал',
    dependencies: [],
    enabled: true,
    priority: 50,
  };

  getModuleName() { return 'my-feature'; }
  getServices() { return [MyFeatureService]; }
  getControllers() { return [MyFeatureController]; }
  getProviders() { return [MyFeatureService]; }
  getExports() { return [MyFeatureService]; }
}
```

### 5. Зарегистрируйте в MicroModulesModule
```typescript
// micro-modules.module.ts
import { MyFeatureMicroModule } from './my-feature/my-feature-micro-module';

// Добавьте в forRoot() или forFeature()
```

## 🎛️ Конфигурация микромодулей

Каждый микромодуль имеет конфигурацию:

```typescript
config = {
  name: 'module-name',           // Уникальное имя
  version: '1.0.0',              // Версия модуля
  description: 'Описание',       // Описание функционала
  dependencies: ['other-module'], // Зависимости
  enabled: true,                 // Включен ли модуль
  priority: 10,                  // Приоритет (меньше = выше)
}
```

## 🔄 Жизненный цикл микромодуля

1. **Инициализация**: модуль регистрируется в менеджере
2. **Загрузка**: зависимости проверяются и загружаются
3. **Активация**: модуль становится доступным для использования
4. **Работа**: модуль выполняет свои функции
5. **Деактивация**: модуль отключается (опционально)

## 🧪 Тестирование микромодулей

### Unit тесты
```typescript
describe('Email2FAService', () => {
  let service: Email2FAService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [Email2FAService],
    }).compile();
    
    service = module.get<Email2FAService>(Email2FAService);
  });
  
  it('should send email code', async () => {
    const result = await service.sendEmailCode('test@example.com', '123456');
    expect(result).toBe(true);
  });
});
```

### Integration тесты
```typescript
describe('MicroModules Integration', () => {
  it('should load all modules', async () => {
    const module = await Test.createTestingModule({
      imports: [MicroModulesModule.forRoot()],
    }).compile();
    
    const manager = module.get<MicroModuleManagerService>(MicroModuleManagerService);
    const stats = manager.getModulesStats();
    
    expect(stats.total).toBeGreaterThan(0);
  });
});
```

## 📈 Мониторинг и логирование

### Логи микромодулей
```typescript
// В каждом микромодуле
console.log('📧 Email 2FA микромодуль готов к работе');
console.log('📱 SMS 2FA микромодуль готов к работе');
console.log('🔐 Two-factor promotion микромодуль готов к работе');
```

### Статистика через API
```http
GET /api/micro-modules/stats
{
  "total": 6,
  "active": 6,
  "inactive": 0,
  "rolePromotion": 3,
  "byType": {
    "role-promotion": 3,
    "two-factor": 3,
    "social-auth": 0
  }
}
```

## 🚨 Обработка ошибок

### Ошибки инициализации
```typescript
try {
  await this.initialize();
} catch (error) {
  console.error(`❌ Ошибка инициализации микромодуля ${this.config.name}:`, error);
  this.config.enabled = false;
}
```

### Ошибки зависимостей
```typescript
if (!this.checkDependencies()) {
  throw new Error(`Микромодуль ${this.config.name} не может быть загружен: отсутствуют зависимости`);
}
```

## 🔮 Планы развития

- [ ] **Social Authentication**: VK, Google, Yandex, OK
- [ ] **Biometric Authentication**: отпечатки, Face ID
- [ ] **Hardware Security Keys**: FIDO2, WebAuthn
- [ ] **Risk-based Authentication**: анализ поведения
- [ ] **Multi-tenant Support**: изоляция по организациям
- [ ] **Plugin System**: загрузка модулей из внешних источников

## 📚 Полезные ссылки

- [NestJS Dynamic Modules](https://docs.nestjs.com/modules#dynamic-modules)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Design Patterns](https://refactoring.guru/design-patterns)

---

**Автор**: AI Assistant  
**Версия**: 1.0.0  
**Дата**: 2024-11-16
