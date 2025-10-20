# Vselena Backend API

Полноценный backend для системы управления базой знаний "Vselena" с JWT аутентификацией, многоуровневой RBAC моделью и полной инфраструктурой.

## 🚀 Технический стек

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Аутентификация**: JWT + Passport + bcrypt
- **Документация**: Swagger/OpenAPI
- **Инфраструктура**: Docker Compose + GitHub Actions CI/CD
- **База данных**: PostgreSQL 15

## 🏗️ Архитектура системы

### Многоуровневая RBAC модель
```
Organization (Организация "Vselena")
    │
    ├── Global Roles (Глобальные роли)
    │   ├── super_admin (полный доступ)
    │   ├── admin (управление организацией)
    │   └── viewer (только просмотр)
    │
    └── Teams (Команды)
        ├── Team "Поддержка"
        │   ├── Team Roles
        │   │   ├── manager (менеджер команды)
        │   │   └── editor (редактор)
        │   └── Users
        │       ├── Ivan Petrov (role: manager)
        │       └── Anna Smith (role: editor)
        │
        └── Team "Разработка"
            ├── Team Roles
            └── Users
```

### JWT токены
- **Access Token**: 15 минут, содержит роли и права
- **Refresh Token**: 7 дней, хранится в БД

### Системные роли (5 ролей)
1. **super_admin** - полный доступ (28 прав)
2. **admin** - администратор организации (27 прав)
3. **manager** - менеджер команды (15 прав)
4. **editor** - редактор контента (8 прав)
5. **viewer** - только просмотр (4 права)

### Гранулярные права (28 прав)
- **users**: create, read, update, delete
- **knowledge**: create, read, update, delete, approve, publish
- **clients**: create, read, update, delete, export
- **settings**: read, update, integrations
- **support**: tickets.read, tickets.update, tickets.assign, chat
- **teams**: create, update, delete, members
- **roles**: create, update, delete, assign

## 📁 Структура проекта

```
src/
├── auth/                    # Аутентификация
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/          # JWT Strategy
│   ├── guards/             # Guards для защиты endpoints
│   ├── decorators/         # @CurrentUser, @Public, @RequirePermissions
│   ├── dto/               # DTOs для валидации
│   └── entities/          # RefreshToken entity
├── rbac/                   # RBAC система
│   ├── rbac.module.ts
│   ├── rbac.service.ts
│   ├── roles.controller.ts
│   ├── permissions.controller.ts
│   └── entities/          # Role, Permission entities
├── users/                  # Управление пользователями
├── organizations/          # Организации
├── teams/                  # Команды
├── config/                 # Конфигурация
└── database/              # Миграции и seeds
    ├── migrations/        # 8 миграций
    └── seeds/            # Seed данные
```

## 🚀 Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
cd vselena-backend
npm install
```

### 2. Настройка переменных окружения

Скопируйте `env.example` в `.env` и настройте:

```bash
cp env.example .env
```

### 3. Запуск через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

### 4. Запуск в режиме разработки

```bash
# Запуск PostgreSQL
docker-compose up postgres -d

# Применение миграций
npm run migration:run

# Запуск seed данных
npm run seed:run

# Запуск приложения
npm run start:dev
```

## 📚 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация (только админы)
- `POST /api/auth/refresh` - Обновление access token
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Текущий пользователь

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/users/:id` - Пользователь по ID
- `POST /api/users` - Создание пользователя
- `PATCH /api/users/:id` - Обновление пользователя
- `DELETE /api/users/:id` - Удаление пользователя

### Роли и права
- `GET /api/roles` - Роли организации
- `POST /api/roles` - Создание роли
- `PATCH /api/roles/:id/permissions` - Обновление прав роли
- `DELETE /api/roles/:id` - Удаление роли
- `GET /api/permissions` - Все доступные права

### Организации и команды
- `GET /api/organizations` - Список организаций
- `GET /api/teams` - Список команд

## 🔐 Безопасность

### JWT токены
```typescript
// Access Token payload
{
  sub: "user-id",
  email: "user@example.com",
  organizationId: "org-id",
  teamId: "team-id",
  roles: ["admin", "manager"],
  permissions: ["users.create", "knowledge.read"],
  iat: 1697461200,
  exp: 1697462100
}
```

### Guards
- **JwtAuthGuard** - проверка валидности JWT
- **PermissionsGuard** - проверка прав доступа
- **RolesGuard** - проверка ролей

### Декораторы
```typescript
@Public()                    // Публичный endpoint
@RequirePermissions('users.create')  // Требует права
@RequireRoles('admin')       // Требует роль
@CurrentUser()               // Получить текущего пользователя
```

## 🐳 Docker

### Docker Compose сервисы
- **postgres** - PostgreSQL 15
- **backend** - NestJS приложение
- **adminer** - Веб-интерфейс для БД (порт 8080)

### Команды Docker
```bash
# Сборка и запуск
docker-compose up --build

# Только база данных
docker-compose up postgres -d

# Просмотр логов
docker-compose logs -f backend

# Остановка и удаление volumes
docker-compose down -v
```

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov

# Тесты в watch режиме
npm run test:watch
```

## 📖 Swagger документация

После запуска приложения документация доступна по адресу:
- **Swagger UI**: http://localhost:3001/api/docs
- **JSON Schema**: http://localhost:3001/api/docs-json

## 🔧 Разработка

### Структура модуля
```typescript
// Пример структуры модуля
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [Controller],
  providers: [Service],
  exports: [Service],
})
export class FeatureModule {}
```

### Создание миграции
```bash
npm run migration:generate -- src/database/migrations/NameOfMigration
```

### Применение миграций
```bash
npm run migration:run
```

### Запуск seed данных
```bash
npm run seed:run
```

## 🚀 Production

### Переменные окружения
```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=secure-password
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### Docker Production
```bash
# Сборка production образа
docker build --target production -t vselena-backend:prod .

# Запуск production контейнера
docker run -p 3001:3001 vselena-backend:prod
```

## 📊 Мониторинг

### Логи
- Все запросы логируются
- Ошибки с stack trace
- JWT токены в логах скрыты

### Health checks
- Database connection
- JWT secret validation
- Environment variables

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch
3. Сделайте commit изменений
4. Push в branch
5. Создайте Pull Request

## 📝 Лицензия

Этот проект лицензирован под MIT License.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте документацию API в Swagger
2. Посмотрите логи приложения
3. Создайте issue в репозитории

---

**Vselena Backend API** - Система управления базой знаний с полной RBAC моделью и JWT аутентификацией.