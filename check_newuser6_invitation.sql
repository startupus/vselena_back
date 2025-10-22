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
    i."acceptedAt",
    i."invitedById",
    u_inviter.email AS inviter_email
FROM invitations i
LEFT JOIN roles r ON i."roleId"::uuid = r.id
LEFT JOIN organizations o ON i."organizationId" = o.id
LEFT JOIN teams t ON i."teamId" = t.id
LEFT JOIN users u_inviter ON i."invitedById" = u_inviter.id
WHERE i.email = 'newuser6@example.com'
ORDER BY i."createdAt" DESC;
