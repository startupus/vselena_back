-- Сброс пароля для admin@vselena.ru
-- Новый пароль: admin123
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzuKa

UPDATE users
SET "passwordHash" = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzuKa'
WHERE email = 'admin@vselena.ru';

SELECT id, email, "firstName", "lastName" FROM users WHERE email = 'admin@vselena.ru';

