SELECT 
    u.email, 
    u.id, 
    r.name as role_name,
    ura."organizationId",
    ura."teamId"
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
WHERE r.name IN ('editor', 'manager', 'admin', 'viewer')
ORDER BY r.name, u.email
LIMIT 20;

