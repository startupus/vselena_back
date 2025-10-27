SELECT r.name, p.name as permission_name 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp."roleId" 
LEFT JOIN permissions p ON rp."permissionId" = p.id 
WHERE r.name = 'super_admin';
