# Настройка реальной отправки Email и SMS

## 📧 Настройка Email (Gmail)

### 1. Создайте App Password для Gmail:

1. Зайдите в [Google Account](https://myaccount.google.com/)
2. Перейдите в **Security** → **2-Step Verification**
3. Включите 2-Step Verification если не включена
4. Перейдите в **App passwords**
5. Выберите **Mail** и **Other (Custom name)**
6. Введите название: "Vselena Backend"
7. Скопируйте сгенерированный 16-символьный пароль

### 2. Обновите docker-compose.yml:

Замените в файле `docker-compose.yml`:
```yaml
SMTP_USER: saschkaproshka04@mail.ru
SMTP_PASSWORD: your-gmail-app-password-here  # ← Замените на App Password
```

## 📱 Настройка SMS (Twilio)

### 1. Зарегистрируйтесь на Twilio:

1. Перейдите на [twilio.com](https://www.twilio.com/)
2. Создайте бесплатный аккаунт
3. Подтвердите номер телефона
4. Перейдите в [Console Dashboard](https://console.twilio.com/)

### 2. Получите данные:

В Dashboard найдите:
- **Account SID** (начинается с AC...)
- **Auth Token** (нажмите "Show" чтобы увидеть)
- **Phone Number** (в разделе Phone Numbers → Manage → Active numbers)

### 3. Обновите docker-compose.yml:

Замените в файле `docker-compose.yml`:
```yaml
TWILIO_ACCOUNT_SID: your-twilio-account-sid      # ← Замените на Account SID
TWILIO_AUTH_TOKEN: your-twilio-auth-token        # ← Замените на Auth Token  
TWILIO_PHONE_NUMBER: your-twilio-phone-number    # ← Замените на Phone Number
```

## 🚀 Запуск с реальными данными

После обновления конфигурации:

```bash
# Перезапустите контейнеры
docker-compose down
docker-compose up -d

# Проверьте логи
docker logs vselena-backend --tail 20
```

## 🧪 Тестирование

### Email:
```bash
curl -X POST http://localhost:3001/api/two-factor/send-code \
  -H "Content-Type: application/json" \
  -d '{"type":"email","contact":"saschkaproshka04@mail.ru"}'
```

### SMS:
```bash
curl -X POST http://localhost:3001/api/two-factor/send-code \
  -H "Content-Type: application/json" \
  -d '{"type":"sms","contact":"+79189562230"}'
```

## 🔧 Альтернативные провайдеры

### Email:
- **SendGrid** (рекомендуется для продакшена)
- **AWS SES**
- **Mailgun**
- **Yandex SMTP**

### SMS:
- **AWS SNS**
- **Vonage (Nexmo)**
- **MessageBird**
- **SMS.ru** (для России)

## ⚠️ Важные замечания

1. **Gmail App Password** - это НЕ ваш обычный пароль Gmail
2. **Twilio** - бесплатный аккаунт дает $15 кредитов для тестирования
3. **Безопасность** - не коммитьте реальные токены в git
4. **Лимиты** - Gmail имеет лимиты на отправку (500 писем/день для бесплатного аккаунта)
