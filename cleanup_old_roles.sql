-- Удаляем старые роли пользователя в команде "1"
DELETE FROM user_role_assignments 
WHERE "userId" = (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru')
AND "teamId" = (SELECT id FROM teams WHERE name = '1');

-- Проверяем результат
SELECT 
    u.email,
    r.name as role_name,
    t.name as team_name,
    ura."createdAt"
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
LEFT JOIN teams t ON ura."teamId" = t.id
WHERE u.email = 'saschkaproshka100@mail.ru'
ORDER BY ura."createdAt" DESC;
