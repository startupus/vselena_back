-- Создание супер-админа
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(), 
    'admin@vselena.ru', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K', 
    'Super', 
    'Admin', 
    true, 
    true, 
    NOW(), 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Получаем ID созданного пользователя
SELECT id FROM users WHERE email = 'admin@vselena.ru';
