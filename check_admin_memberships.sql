-- Проверяем членство в организации
SELECT 'org' as type, u.email, om."organizationId", o.name as name, om."roleId", or_role.name as role_name 
FROM users u 
JOIN organization_memberships om ON u.id = om."userId" 
JOIN organizations o ON om."organizationId" = o.id 
JOIN organization_roles or_role ON om."roleId" = or_role.id 
WHERE u.email = 'saschkaproshka04@mail.ru'

UNION ALL

-- Проверяем членство в команде
SELECT 'team' as type, u.email, tm."teamId", t.name as name, tm."roleId", tr.name as role_name 
FROM users u 
JOIN team_memberships tm ON u.id = tm."userId" 
JOIN teams t ON tm."teamId" = t.id 
JOIN team_roles tr ON tm."roleId" = tr.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
