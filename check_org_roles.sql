SELECT r.id, r.name, r.description, r."organizationId", r."teamId", r."isGlobal"
FROM roles r 
WHERE r."organizationId" = '78a6f280-5317-4f02-b36e-df844673a9cd' 
   OR r."isGlobal" = true
ORDER BY r."isGlobal" DESC, r."organizationId", r."teamId";