SELECT 
    u.email, 
    ura.roleId, 
    r.name as role_name, 
    ura.organizationId, 
    ura.teamId,
    t.name as team_name,
    o.name as org_name
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura.userId 
LEFT JOIN roles r ON ura.roleId = r.id 
LEFT JOIN teams t ON ura.teamId = t.id
LEFT JOIN organizations o ON ura.organizationId = o.id
WHERE u.email = 'saschkaproshka04@mail.ru';
