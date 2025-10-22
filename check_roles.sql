SELECT u.email, r.name AS role_name 
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
WHERE u.email LIKE '%saschkaproshka%' OR u.email LIKE '%newuser%';