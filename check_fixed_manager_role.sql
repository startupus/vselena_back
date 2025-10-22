SELECT 
    u.email, 
    r.name AS role_name,
    ura."teamId",
    t.name AS team_name,
    ura."organizationId",
    o.name AS organization_name,
    ura."createdAt" AS assigned_at
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
LEFT JOIN teams t ON ura."teamId" = t.id
LEFT JOIN organizations o ON ura."organizationId" = o.id
WHERE u.email = 'saschkaproshka100@mail.ru'
AND r.name = 'manager';
