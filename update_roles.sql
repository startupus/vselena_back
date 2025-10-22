-- Удаляем старые роли
DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles);
DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles);
DELETE FROM roles;

-- Создаем новые правильные роли
INSERT INTO roles (id, name, description, "isSystem", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'super_admin', 'Супер администратор - полный доступ ко всем функциям', true, NOW(), NOW()),
(gen_random_uuid(), 'admin', 'Администратор - управление организацией и командами', true, NOW(), NOW()),
(gen_random_uuid(), 'manager', 'Менеджер - управление командой и проектами', true, NOW(), NOW()),
(gen_random_uuid(), 'editor', 'Редактор - создание и редактирование контента', true, NOW(), NOW()),
(gen_random_uuid(), 'viewer', 'Наблюдатель - только просмотр', true, NOW(), NOW());

-- Проверяем результат
SELECT id, name, description FROM roles ORDER BY name;
