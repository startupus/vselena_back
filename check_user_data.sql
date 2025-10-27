-- Проверяем данные пользователя перед удалением
SELECT 'BEFORE DELETE:' as status;

SELECT 'Users:' as table_name, count(*) as count FROM users WHERE email = 'test_delete@example.com'
UNION ALL
SELECT 'Refresh tokens:', count(*) FROM refresh_tokens rt JOIN users u ON rt."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Role assignments:', count(*) FROM user_role_assignments ura JOIN users u ON ura."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Notifications:', count(*) FROM notifications n JOIN users u ON n."userId" = u.id WHERE u.email = 'test_delete@example.com'
UNION ALL
SELECT 'Audit logs:', count(*) FROM audit_logs al JOIN users u ON al."userId" = u.id WHERE u.email = 'test_delete@example.com';
