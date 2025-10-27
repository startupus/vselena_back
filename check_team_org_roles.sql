-- Проверяем роли в командах
SELECT 
    u.email, 
    t.name as team_name,
    tr.name as role_name,
    tr.level as role_level
FROM team_memberships tm
JOIN users u ON tm."userId" = u.id
JOIN teams t ON tm."teamId" = t.id
JOIN team_roles tr ON tm."roleId" = tr.id
ORDER BY tr.level DESC, u.email
LIMIT 20;

-- Проверяем роли в организациях
SELECT 
    u.email, 
    o.name as org_name,
    orr.name as role_name,
    orr.level as role_level
FROM organization_memberships om
JOIN users u ON om."userId" = u.id
JOIN organizations o ON om."organizationId" = o.id
JOIN organization_roles orr ON om."roleId" = orr.id
ORDER BY orr.level DESC, u.email
LIMIT 20;

