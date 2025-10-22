SELECT 
    i.email,
    i.status,
    i."roleId",
    r.name AS role_name,
    i."createdAt",
    i."acceptedAt",
    i."invitedById",
    u_inviter.email AS inviter_email
FROM invitations i
LEFT JOIN roles r ON i."roleId"::uuid = r.id
LEFT JOIN users u_inviter ON i."invitedById" = u_inviter.id
WHERE i.email = 'saschkaproshka100@mail.ru'
ORDER BY i."createdAt" DESC;
