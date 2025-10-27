-- Проверяем, где находится роль a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27
SELECT 'team_roles' as table_name, id, name, "teamId" 
FROM team_roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27'

UNION ALL

SELECT 'organization_roles' as table_name, id, name, NULL as "teamId" 
FROM organization_roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27'

UNION ALL

SELECT 'roles' as table_name, id, name, NULL as "teamId" 
FROM roles 
WHERE id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27';
