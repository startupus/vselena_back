-- Назначаем все права роли super_admin
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
