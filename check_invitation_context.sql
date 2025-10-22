SELECT 
    i.email,
    i.status,
    i."roleId",
    r.name AS role_name,
    i."organizationId",
    o.name AS organization_name,
    i."teamId",
    t.name AS team_name,
    i."createdAt",
    i."acceptedAt"
FROM invitations i
LEFT JOIN roles r ON i."roleId"::uuid = r.id
LEFT JOIN organizations o ON i."organizationId" = o.id
LEFT JOIN teams t ON i."teamId" = t.id
WHERE i.email = 'saschkaproshka100@mail.ru' 
AND i."invitedById" = '00dec543-7d9e-4948-9255-f3623a102770'
ORDER BY i."createdAt" DESC
LIMIT 1;
