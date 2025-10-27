SELECT r.id, r.name, r.description, r."teamId", r."organizationId", r."isGlobal"
FROM roles r 
ORDER BY r."isGlobal" DESC, r."organizationId", r."teamId";
