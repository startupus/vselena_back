SELECT id, name, description, "organizationId", "teamId", "isGlobal"
FROM roles 
WHERE "organizationId" = '78a6f280-5317-4f02-b36e-df844673a9cd' 
   OR "isGlobal" = true
ORDER BY "isGlobal" DESC;
