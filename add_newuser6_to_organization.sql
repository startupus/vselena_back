INSERT INTO user_organizations (user_id, organization_id)
SELECT 
    u.id,
    'ea9e8b25-3b7c-40ef-8a94-6f0ae6e96391'
FROM users u 
WHERE u.email = 'newuser6@example.com'
AND NOT EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = u.id 
    AND uo.organization_id = 'ea9e8b25-3b7c-40ef-8a94-6f0ae6e96391'
);
