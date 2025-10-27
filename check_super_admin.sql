SELECT u.email, r.name as role_name, ura."organizationId", ura."teamId" 
FROM users u 
JOIN user_role_assignments ura ON u.id = ura."userId" 
JOIN roles r ON ura."roleId" = r.id 
WHERE r.name = 'super_admin';
