SELECT u.email, ura.roleId, r.name as role_name, ura.organizationId, ura.teamId 
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura.userId 
LEFT JOIN roles r ON ura.roleId = r.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
