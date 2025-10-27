-- Назначаем роль viewer пользователю viewer_test@vselena.ru
INSERT INTO user_role_assignments ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.email = 'viewer_test@vselena.ru' AND r.name = 'viewer'
ON CONFLICT ("userId", "roleId") DO NOTHING;
