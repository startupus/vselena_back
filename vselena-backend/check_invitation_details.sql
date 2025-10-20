-- Проверяем детали приглашения для saschkaproshka100@mail.ru
SELECT 
    i.id,
    i.email,
    i."firstName",
    i."lastName",
    i.type,
    i.status,
    i."teamId",
    i."organizationId",
    i."invitedById",
    i."acceptedById",
    i."createdAt",
    t.name as team_name,
    o.name as org_name,
    inviter.email as inviter_email
FROM invitations i
LEFT JOIN teams t ON i."teamId" = t.id
LEFT JOIN organizations o ON i."organizationId" = o.id
LEFT JOIN users inviter ON i."invitedById" = inviter.id
WHERE i.email = 'saschkaproshka100@mail.ru'
ORDER BY i."createdAt" DESC;
