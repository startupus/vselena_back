-- Назначаем роль super_admin пользователю newtest@example.com
INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'newtest@example.com' 
AND r.name = 'super_admin';
