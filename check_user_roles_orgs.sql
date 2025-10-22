-- Проверяем роли пользователя saschkaproshka@yandex.ru
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    ura.id as role_assignment_id,
    r.name as role_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
WHERE u.email = 'saschkaproshka@yandex.ru';

-- Проверяем связи с организациями
SELECT 
    u.email,
    uo."organizationId",
    o.name as org_name
FROM users u
LEFT JOIN user_organizations uo ON u.id = uo."userId"
LEFT JOIN organizations o ON uo."organizationId" = o.id
WHERE u.email = 'saschkaproshka@yandex.ru';

-- Проверяем связи с командами
SELECT 
    u.email,
    ut."teamId",
    t.name as team_name
FROM users u
LEFT JOIN user_teams ut ON u.id = ut."userId"
LEFT JOIN teams t ON ut."teamId" = t.id
WHERE u.email = 'saschkaproshka@yandex.ru';

