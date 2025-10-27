-- Создаем роли для организации в таблице roles
INSERT INTO roles (id, name, description, "organizationId", "teamId", "isGlobal", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'admin', 'Администратор организации', '78a6f280-5317-4f02-b36e-df844673a9cd', null, false, true, NOW(), NOW()),
  (gen_random_uuid(), 'manager', 'Менеджер организации', '78a6f280-5317-4f02-b36e-df844673a9cd', null, false, true, NOW(), NOW()),
  (gen_random_uuid(), 'editor', 'Редактор организации', '78a6f280-5317-4f02-b36e-df844673a9cd', null, false, true, NOW(), NOW()),
  (gen_random_uuid(), 'viewer', 'Наблюдатель организации', '78a6f280-5317-4f02-b36e-df844673a9cd', null, false, true, NOW(), NOW());
