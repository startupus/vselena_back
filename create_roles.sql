-- Создание роли super_admin
INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(), 
    'super_admin', 
    'Суперадминистратор с полным доступом', 
    true, 
    true, 
    NOW(), 
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- Создание роли admin
INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(), 
    'admin', 
    'Администратор организации', 
    true, 
    true, 
    NOW(), 
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- Создание роли viewer
INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(), 
    'viewer', 
    'Пользователь с правами просмотра', 
    true, 
    true, 
    NOW(), 
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- Получаем ID ролей
SELECT id, name FROM roles;
