-- Создание пользователя с ролью viewer
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'viewer_test@vselena.ru', '$2b$12$3k9Lo0MQcH5OhERrBA3wUObplKU/o3f9VGymr2b921J7t8IephDJW', 'Test', 'Viewer', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Назначаем роль viewer
INSERT INTO user_role_assignments ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.email = 'viewer_test@vselena.ru' AND r.name = 'viewer'
ON CONFLICT ("userId", "roleId") DO NOTHING;