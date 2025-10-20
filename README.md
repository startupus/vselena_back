# Vselena Knowledge Management System

Система управления базой знаний и поддержкой с полной аутентификацией, RBAC и системой приглашений.

## 🏗️ Архитектура проекта

```
vselena/
├── vselena-backend/     # NestJS Backend API
├── frontend/            # HTML/CSS/JavaScript Frontend
└── README.md           # Документация проекта
```

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/teramisuslik/vselena.git
cd vselena
```

### 2. Запуск через Docker Compose
```bash
cd vselena-backend
docker-compose up -d
```

### 3. Доступ к приложению
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database Admin**: http://localhost:8080

## 🔐 Учетные данные по умолчанию

### Администратор
- **Email**: `admin@vselena.ru`
- **Пароль**: `admin123`

### Тестовые пользователи
- **Email**: `saschkaproshka04@mail.ru` (менеджер)
- **Пароль**: `22222222`
- **Email**: `saschkaproshka100@mail.ru` (сотрудник)
- **Пароль**: `11111111`

## ✨ Основные возможности

### Backend (NestJS)
- ✅ JWT аутентификация с access/refresh токенами
- ✅ RBAC система (роли и права доступа)
- ✅ Система приглашений пользователей
- ✅ Вход по коду с почты
- ✅ Двухфакторная аутентификация (2FA)
- ✅ Сброс пароля через email
- ✅ Аудит действий пользователей
- ✅ Управление организациями и командами
- ✅ Swagger API документация
- ✅ Docker контейнеризация
- ✅ PostgreSQL база данных с миграциями

### Frontend (HTML/CSS/JavaScript)
- ✅ Современный адаптивный интерфейс
- ✅ Авторизация (email/пароль + код с почты)
- ✅ Дашборд с управлением пользователями
- ✅ Система приглашений
- ✅ Ролевая система UI
- ✅ Интеграция с Backend API

## 🛠️ Технологии

### Backend
- **NestJS** - Node.js фреймворк
- **TypeORM** - ORM для работы с БД
- **PostgreSQL** - основная база данных
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей
- **Swagger** - API документация
- **Docker** - контейнеризация

### Frontend
- **HTML5/CSS3** - разметка и стили
- **JavaScript (ES6+)** - логика приложения
- **Fetch API** - HTTP запросы
- **Responsive Design** - адаптивность

## 📁 Структура проекта

### Backend (`vselena-backend/`)
```
src/
├── auth/                    # Аутентификация и авторизация
│   ├── micro-modules/       # Микромодули (приглашения, 2FA, etc.)
│   ├── guards/              # Guards для защиты endpoints
│   ├── decorators/          # Декораторы (@CurrentUser, @Public, etc.)
│   └── strategies/          # Passport стратегии
├── users/                   # Управление пользователями
├── rbac/                    # Роли и права доступа
├── organizations/           # Организации
├── teams/                   # Команды
├── notifications/           # Уведомления
├── audit/                   # Аудит действий
└── database/                # Миграции и seeds
```

### Frontend (`frontend/`)
```
├── index.html              # Страница авторизации
├── dashboard.html          # Основной дашборд
├── reset-password.html     # Сброс пароля
├── js/                     # JavaScript файлы
└── css/                    # Стили (встроенные в HTML)
```

## 🔧 Разработка

### Backend
```bash
cd vselena-backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
# Открыть index.html в браузере
# Или запустить локальный сервер:
npx http-server -p 3000
```

### База данных
```bash
# Применить миграции
npm run migration:run

# Запустить seeds
npm run seed:run
```

## 🐳 Docker

### Запуск всех сервисов
```bash
cd vselena-backend
docker-compose up -d
```

### Остановка
```bash
docker-compose down
```

### Пересборка
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

### Приглашения
- `GET /api/invitations/my` - Мои приглашения
- `GET /api/invitations/sent` - Отправленные приглашения
- `POST /api/invitations` - Создать приглашение
- `POST /api/invitations/:id/accept` - Принять приглашение
- `DELETE /api/invitations/:id` - Отменить приглашение

### Пользователи
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создать пользователя
- `PATCH /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

## 🔒 Безопасность

- JWT токены с коротким временем жизни (15 минут)
- Refresh токены для обновления сессии
- Хеширование паролей с bcrypt
- Валидация всех входных данных
- CORS настройки
- Rate limiting
- Аудит всех действий

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в GitHub репозитории.
