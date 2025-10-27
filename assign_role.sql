-- Назначение роли super_admin пользователю admin@vselena.ru
INSERT INTO user_role_assignments ("userId", "roleId", "createdAt", "updatedAt")
SELECT 
    u.id as "userId",
    r.id as "roleId",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM users u, roles r 
WHERE u.email = 'admin@vselena.ru' 
AND r.name = 'super_admin';

-- Проверяем назначение
SELECT u.email, r.name as role_name 
FROM users u 
JOIN user_role_assignments ura ON u.id = ura."userId"
JOIN roles r ON r.id = ura."roleId"
WHERE u.email = 'admin@vselena.ru';
