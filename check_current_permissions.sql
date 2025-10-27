SELECT r.name as role_name, p.name as permission_name 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp."roleId" 
LEFT JOIN permissions p ON rp."permissionId" = p.id 
ORDER BY r.name, p.name;
