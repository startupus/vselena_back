-- Создаем тестового пользователя
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified", "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'test_delete@example.com', '$2b$12$test', 'Test', 'User', true, true, NOW(), NOW()) 
RETURNING id, email;

-- Создаем связанные данные для тестирования
-- 1. Refresh token
INSERT INTO refresh_tokens (token, "userId", "expiresAt", "isRevoked", "createdAt", "updatedAt")
SELECT 'test-token-123', id, NOW() + INTERVAL '7 days', false, NOW(), NOW()
FROM users WHERE email = 'test_delete@example.com';

-- 2. User role assignment
INSERT INTO user_role_assignments (id, "userId", "roleId", "organizationId", "teamId", "assignedBy", "expiresAt", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u.id, r.id, null, null, null, null, NOW(), NOW()
FROM users u, roles r 
WHERE u.email = 'test_delete@example.com' AND r.name = 'viewer'
LIMIT 1;

-- 3. Notification
INSERT INTO notifications (id, "userId", title, message, "isRead", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Test Notification', 'This is a test notification', false, NOW(), NOW()
FROM users WHERE email = 'test_delete@example.com';

-- 4. Audit log
INSERT INTO audit_logs (id, "userId", service, action, resource, "resourceId", "requestData", "responseData", "statusCode", "ipAddress", "userAgent", "userRoles", "userPermissions", "organizationId", "teamId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'test', 'create', 'test', id, '{}', '{}', 200, '127.0.0.1', 'test', '[]', '[]', null, null, NOW(), NOW()
FROM users WHERE email = 'test_delete@example.com';

-- Проверяем, что данные созданы
SELECT 'Users:' as table_name, count(*) as count FROM users WHERE email = 'test_delete@example.com'
UNION ALL
SELECT 'Refresh tokens:', count(*) FROM refresh_tokens rt JOIN users u ON rt."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Role assignments:', count(*) FROM user_role_assignments ura JOIN users u ON ura."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Notifications:', count(*) FROM notifications n JOIN users u ON n."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Audit logs:', count(*) FROM audit_logs al JOIN users u ON al."userId" = u.id WHERE u.email = 'test_delete@example.com';
