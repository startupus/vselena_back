INSERT INTO user_role_assignments ("userId", "roleId")
SELECT 
    u.id,
    '7d60061e-5f5e-4f71-a297-84c3f641f4d5'
FROM users u 
WHERE u.email = 'saschkaproshka100@mail.ru'
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura."userId" = u.id 
    AND ura."roleId" = '7d60061e-5f5e-4f71-a297-84c3f641f4d5'
);
