SELECT t.id, t.name, t."organizationId", o.name as org_name 
FROM teams t 
LEFT JOIN organizations o ON t."organizationId" = o.id 
WHERE t.id = 'd47e3498-2000-4123-95e0-bc9ec3d10f4a';
