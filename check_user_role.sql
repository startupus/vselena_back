-- Проверяем роль пользователя
SELECT u.email, r.name as role_name 
FROM users u 
JOIN user_role_assignments ura ON u.id = ura."userId" 
JOIN roles r ON ura."roleId" = r.id 
WHERE u.email = 'test_registration3@example.com';
