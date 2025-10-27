-- Обновление пароля для admin@vselena.ru
UPDATE users 
SET "passwordHash" = '$2b$12$3k9Lo0MQcH5OhERrBA3wUObplKU/o3f9VGymr2b921J7t8IephDJW'
WHERE email = 'admin@vselena.ru';

-- Проверяем обновление
SELECT email, "passwordHash" FROM users WHERE email = 'admin@vselena.ru';
