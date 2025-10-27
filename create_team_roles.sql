-- Создаем роли для команды "111" в таблице roles
INSERT INTO roles (id, name, description, "organizationId", "teamId", "isGlobal", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'admin', 'Администратор команды', '78a6f280-5317-4f02-b36e-df844673a9cd', '1010e5c4-55c7-4ea9-b3d5-21fa612851e8', false, true, NOW(), NOW()),
  (gen_random_uuid(), 'manager', 'Менеджер команды', '78a6f280-5317-4f02-b36e-df844673a9cd', '1010e5c4-55c7-4ea9-b3d5-21fa612851e8', false, true, NOW(), NOW()),
  (gen_random_uuid(), 'editor', 'Редактор команды', '78a6f280-5317-4f02-b36e-df844673a9cd', '1010e5c4-55c7-4ea9-b3d5-21fa612851e8', false, true, NOW(), NOW()),
  (gen_random_uuid(), 'viewer', 'Наблюдатель команды', '78a6f280-5317-4f02-b36e-df844673a9cd', '1010e5c4-55c7-4ea9-b3d5-21fa612851e8', false, true, NOW(), NOW());
