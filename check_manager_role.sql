SELECT 
    u.email, 
    r.name AS role_name,
    r.id AS role_id,
    ura."createdAt" AS assigned_at
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN roles r ON ura."roleId" = r.id 
WHERE u.email = 'saschkaproshka100@mail.ru' 
AND r.id = '7d60061e-5f5e-4f71-a297-84c3f641f4d5';
