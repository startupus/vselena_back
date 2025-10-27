-- Проверяем пользователя test@example.com
SELECT id, email, "firstName", "lastName", "isActive", "emailVerified"
FROM users 
WHERE email = 'test@example.com';
