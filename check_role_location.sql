-- Проверяем, где находится роль editor
SELECT 'team_roles' as table_name, id, name, "teamId", "organizationId" 
FROM team_roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27'

UNION ALL

SELECT 'organization_roles' as table_name, id, name, "teamId", "organizationId" 
FROM organization_roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27'

UNION ALL

SELECT 'roles' as table_name, id, name, "teamId", "organizationId" 
FROM roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27';
