-- Активируем пользователя test@example.com
UPDATE users 
SET "emailVerified" = true, "isActive" = true
WHERE email = 'test@example.com';
