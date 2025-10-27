-- Назначаем роль admin пользователю admin_test@vselena.ru
INSERT INTO user_role_assignments ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.email = 'admin_test@vselena.ru' AND r.name = 'admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;
