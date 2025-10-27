-- Проверяем роли в organization_roles
SELECT 'Organization Roles:' as info;
SELECT id, name, "organizationId", level, "isSystem" 
FROM organization_roles 
WHERE "organizationId" = '78a6f280-5317-4f02-b36e-df844673a9cd';

-- Проверяем роли в team_roles
SELECT 'Team Roles:' as info;
SELECT id, name, "teamId", level, "isSystem" 
FROM team_roles 
WHERE "teamId" = '1010e5c4-55c7-4ea9-b3d5-21fa612851e8';

-- Проверяем глобальные роли
SELECT 'Global Roles:' as info;
SELECT id, name, "isGlobal", level, "isSystem" 
FROM roles 
WHERE "isGlobal" = true;

