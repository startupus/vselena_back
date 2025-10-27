-- Проверяем, есть ли пользователь с email boss.ldm@gmail.com
SELECT id, email, firstName, lastName, "twoFactorEnabled" FROM users WHERE email = 'boss.ldm@gmail.com';

-- Если пользователь существует, даем ему роль super_admin
-- Сначала найдем ID роли super_admin
SELECT id, name FROM roles WHERE name = 'super_admin';

-- Назначим роль super_admin пользователю (замените USER_ID и ROLE_ID на реальные значения)
-- INSERT INTO user_roles (userId, roleId, grantedAt) 
-- VALUES ('USER_ID', 'ROLE_ID', NOW())
-- ON CONFLICT (userId, roleId) DO NOTHING;
