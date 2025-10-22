SELECT 
    u.email, 
    r.name AS role_name,
    ura."createdAt" AS assigned_at
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
WHERE u.email = 'saschkaproshka100@mail.ru'
ORDER BY ura."createdAt" DESC;
