-- Создаем пользователя boss.ldm@gmail.com если его нет
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified", "twoFactorEnabled", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'boss.ldm@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', -- пароль: boss123
    'Boss',
    'LDM',
    true,
    true,
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Находим ID пользователя
SELECT id, email FROM users WHERE email = 'boss.ldm@gmail.com';

-- Находим ID роли super_admin
SELECT id, name FROM roles WHERE name = 'super_admin';

-- Назначаем роль super_admin (замените USER_ID и ROLE_ID на реальные значения)
-- INSERT INTO user_roles (id, "userId", "roleId", "grantedAt")
-- VALUES (gen_random_uuid(), 'USER_ID', 'ROLE_ID', NOW())
-- ON CONFLICT ("userId", "roleId") DO NOTHING;
