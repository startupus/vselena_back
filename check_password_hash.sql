-- Проверяем хеш пароля существующего пользователя
SELECT email, "passwordHash"
FROM users 
WHERE email = 'saschkaproshka04@mail.ru';
