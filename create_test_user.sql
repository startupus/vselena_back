-- Создаем тестового пользователя с известным паролем
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified") 
VALUES (
    gen_random_uuid(), 
    'testuser@example.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J5Q5Q5Q5Q', 
    'Test', 
    'User', 
    true, 
    true
);

-- Назначаем роль super_admin
INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'testuser@example.com' 
AND r.name = 'super_admin';
