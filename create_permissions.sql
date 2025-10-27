-- Создаем базовые права
INSERT INTO permissions (id, name, description, resource, action, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'users.create', 'Создание пользователей', 'users', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'users.read', 'Просмотр пользователей', 'users', 'read', NOW(), NOW()),
  (gen_random_uuid(), 'users.update', 'Редактирование пользователей', 'users', 'update', NOW(), NOW()),
  (gen_random_uuid(), 'users.delete', 'Удаление пользователей', 'users', 'delete', NOW(), NOW()),
  (gen_random_uuid(), 'knowledge.create', 'Создание материалов базы знаний', 'knowledge', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'knowledge.read', 'Просмотр материалов базы знаний', 'knowledge', 'read', NOW(), NOW()),
  (gen_random_uuid(), 'knowledge.update', 'Редактирование материалов', 'knowledge', 'update', NOW(), NOW()),
  (gen_random_uuid(), 'knowledge.delete', 'Удаление материалов', 'knowledge', 'delete', NOW(), NOW()),
  (gen_random_uuid(), 'settings.read', 'Просмотр настроек', 'settings', 'read', NOW(), NOW()),
  (gen_random_uuid(), 'settings.update', 'Изменение настроек', 'settings', 'update', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
