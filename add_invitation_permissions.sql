-- Добавляем права для приглашений
INSERT INTO permissions (id, name, description, resource, action, "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'invitations.create', 'Создание приглашений', 'invitations', 'create', NOW(), NOW()),
(gen_random_uuid(), 'invitations.read', 'Просмотр приглашений', 'invitations', 'read', NOW(), NOW()),
(gen_random_uuid(), 'invitations.update', 'Редактирование приглашений', 'invitations', 'update', NOW(), NOW()),
(gen_random_uuid(), 'invitations.delete', 'Удаление приглашений', 'invitations', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'teams.members', 'Управление участниками команд', 'teams', 'members', NOW(), NOW()),
(gen_random_uuid(), 'organizations.members', 'Управление участниками организаций', 'organizations', 'members', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Получаем ID роли super_admin
WITH super_admin_role AS (
  SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
),
-- Получаем все новые права
new_permissions AS (
  SELECT id FROM permissions WHERE name IN (
    'invitations.create', 'invitations.read', 'invitations.update', 'invitations.delete',
    'teams.members', 'organizations.members'
  )
)
-- Назначаем все права роли super_admin
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  sar.id,
  np.id,
  NOW(),
  NOW()
FROM super_admin_role sar
CROSS JOIN new_permissions np
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Проверяем результат
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'super_admin'
AND p.name LIKE 'invitations.%' OR p.name LIKE '%.members'
ORDER BY p.name;
