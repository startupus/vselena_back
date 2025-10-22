SELECT 
    t.id,
    t.name,
    t."organizationId",
    o.name AS organization_name
FROM teams t
LEFT JOIN organizations o ON t."organizationId" = o.id
WHERE t."organizationId" = 'ea9e8b25-3b7c-40ef-8a94-6f0ae6e96391';
