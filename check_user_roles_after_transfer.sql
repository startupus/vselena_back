-- Проверяем роли пользователя после переноса
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    r.name as role_name,
    o.name as organization_name,
    t.name as team_name,
    ura."createdAt"
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
LEFT JOIN organizations o ON ura."organizationId" = o.id
LEFT JOIN teams t ON ura."teamId" = t.id
WHERE u.email = 'saschkaproshka100@mail.ru'
ORDER BY ura."createdAt" DESC;

-- Проверяем членство пользователя в командах
SELECT 
    u.email,
    t.name as team_name,
    t.id as team_id
FROM users u
LEFT JOIN user_teams ut ON u.id = ut.user_id
LEFT JOIN teams t ON ut.team_id = t.id
WHERE u.email = 'saschkaproshka100@mail.ru';
