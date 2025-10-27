-- Проверяем глобальные роли
SELECT 
    u.email,
    r.name as global_role,
    r.id as role_id
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
WHERE u.email IN ('saschkaproshka04@mail.ru', 'saschkaproshka100@mail.ru', 'saschkaproshka@ya.ru')
  AND ura."organizationId" IS NULL 
  AND ura."teamId" IS NULL
ORDER BY u.email;

-- Проверяем роли в организациях
SELECT 
    u.email,
    o.name as org_name,
    orr.name as org_role,
    orr.level as role_level
FROM organization_memberships om
JOIN users u ON om."userId" = u.id
JOIN organizations o ON om."organizationId" = o.id
JOIN organization_roles orr ON om."roleId" = orr.id
WHERE u.email IN ('saschkaproshka04@mail.ru', 'saschkaproshka100@mail.ru', 'saschkaproshka@ya.ru')
ORDER BY u.email, o.name;

-- Проверяем роли в командах
SELECT 
    u.email,
    t.name as team_name,
    tr.name as team_role,
    tr.level as role_level
FROM team_memberships tm
JOIN users u ON tm."userId" = u.id
JOIN teams t ON tm."teamId" = t.id
JOIN team_roles tr ON tm."roleId" = tr.id
WHERE u.email IN ('saschkaproshka04@mail.ru', 'saschkaproshka100@mail.ru', 'saschkaproshka@ya.ru')
ORDER BY u.email, t.name;

