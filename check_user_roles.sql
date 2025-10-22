-- Проверяем роли пользователя saschkaproshka@yandex.ru
SELECT 
    u.email,
    ura.id as assignment_id,
    r.name as role_name,
    ura."createdAt" as assigned_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
WHERE u.email = 'saschkaproshka@yandex.ru';