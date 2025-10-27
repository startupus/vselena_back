SELECT t.id, t.name, t."organizationId", o.name as org_name 
FROM teams t 
LEFT JOIN organizations o ON t."organizationId" = o.id 
WHERE t.id = '13b199ca-1a51-4184-ae97-80edcded954d';
