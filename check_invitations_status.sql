-- Проверяем все приглашения от newuser5
SELECT 
    i.email,
    i.status,
    i."acceptedAt",
    i."createdAt",
    u.email as inviter_email
FROM invitations i
JOIN users u ON i."invitedById" = u.id
WHERE u.email LIKE '%newuser5%'
ORDER BY i."createdAt" DESC;

-- Проверяем пользователей, которые были приглашены
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    u."isActive",
    u."emailVerified",
    u."createdAt"
FROM users u
WHERE u.email IN (
    SELECT i.email 
    FROM invitations i
    JOIN users u2 ON i."invitedById" = u2.id
    WHERE u2.email LIKE '%newuser5%'
)
ORDER BY u."createdAt" DESC;
