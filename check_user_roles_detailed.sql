-- Проверяем роли пользователей в разных контекстах
SELECT 
    u.email,
    ura."organizationId",
    ura."teamId", 
    r.name as role_name,
    r.description as role_description
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
WHERE u.email IN ('newuser5@example.com', 'newuser6@example.com', 'saschkaproshka100@mail.ru')
ORDER BY u.email, ura."organizationId", ura."teamId";
