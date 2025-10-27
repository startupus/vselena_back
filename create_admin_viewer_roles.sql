-- Создаем роли admin и viewer
INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin', 'Administrator with management capabilities', true, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'viewer', 'Default user role with read-only access', true, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Назначаем права роли admin (все права кроме super_admin)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
  'users.create', 'users.read', 'users.update', 'users.delete',
  'knowledge.create', 'knowledge.read', 'knowledge.update', 'knowledge.delete',
  'knowledge.approve', 'knowledge.publish',
  'clients.create', 'clients.read', 'clients.update', 'clients.delete', 'clients.export',
  'settings.read', 'settings.update', 'settings.integrations',
  'support.tickets.read', 'support.tickets.update', 'support.tickets.assign', 'support.chat',
  'organizations.create', 'organizations.read', 'organizations.update', 'organizations.delete', 'organizations.members',
  'teams.create', 'teams.read', 'teams.update', 'teams.delete', 'teams.members',
  'teams.create_standalone', 'teams.create_organization',
  'roles.create', 'roles.update', 'roles.delete', 'roles.assign'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Назначаем права роли viewer (только чтение)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name IN (
  'users.read',
  'knowledge.read',
  'clients.read',
  'settings.read',
  'support.tickets.read',
  'organizations.read',
  'teams.read'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
