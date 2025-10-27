SELECT u.email, o.name as org_name 
FROM users u 
JOIN organization_memberships om ON u.id = om."userId" 
JOIN organizations o ON om."organizationId" = o.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
