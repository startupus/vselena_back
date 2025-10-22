# Настройка FRONTEND_URL для продакшена

## Проблема
В проекте были исправлены хардкод ссылки на localhost в письмах для восстановления пароля и подтверждения email. Теперь все ссылки формируются на основе переменной окружения `FRONTEND_URL`.

## Исправленные файлы
1. `src/auth/password-reset.service.ts` - ссылки для восстановления пароля
2. `src/auth/auth.service.ts` - ссылки для подтверждения email
3. `src/main.ts` - CORS настройки

## Настройка для продакшена

### 1. Переменная окружения FRONTEND_URL
Установите правильный URL вашего фронтенда:

```bash
# Для продакшена
FRONTEND_URL=https://your-domain.com

# Для staging
FRONTEND_URL=https://staging.your-domain.com

# Для разработки (по умолчанию)
FRONTEND_URL=http://localhost:3000
```

### 2. Docker Compose
В файле `docker-compose.yml` обновите переменную:

```yaml
environment:
  FRONTEND_URL: https://your-domain.com  # Замените на ваш домен
```

### 3. .env файл
Создайте `.env` файл с правильным URL:

```env
FRONTEND_URL=https://your-domain.com
```

### 4. Проверка
После настройки проверьте, что ссылки в письмах ведут на правильный домен:

1. Запросите восстановление пароля
2. Проверьте письмо - ссылка должна вести на `https://your-domain.com/reset-password?token=...`
3. Запросите подтверждение email
4. Проверьте письмо - ссылка должна вести на `https://your-domain.com/?verify-email=true&token=...`

## Примеры правильных ссылок

### Восстановление пароля
```
https://your-domain.com/reset-password?token=abc123...
```

### Подтверждение email
```
https://your-domain.com/?verify-email=true&token=def456...
```

### Приглашения
```
https://your-domain.com/register?invite=ghi789...
```

## Безопасность
- Убедитесь, что используете HTTPS в продакшене
- Не используйте localhost в продакшене
- Проверьте, что домен в FRONTEND_URL соответствует реальному домену фронтенда
