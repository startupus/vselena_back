SELECT u.email, r.name as role_name
FROM users u
JOIN user_role_assignments ura ON u.id = ura."userId"
JOIN roles r ON ura."roleId" = r.id
WHERE u.email IN ('admin@vselena.ru', 'admin_test@vselena.ru', 'viewer_test@vselena.ru')
ORDER BY u.email;