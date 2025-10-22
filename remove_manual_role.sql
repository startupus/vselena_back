-- Удаляем роль, назначенную вручную, чтобы проверить автоматическое назначение
DELETE FROM user_role_assignments 
WHERE "userId" = (SELECT id FROM users WHERE email = 'saschkaproshka@yandex.ru')
  AND "roleId" = (SELECT id FROM roles WHERE name = 'viewer');
