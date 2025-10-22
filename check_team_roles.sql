SELECT 
    u.email,
    r.name AS role_name,
    ura."teamId",
    t.name AS team_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
LEFT JOIN teams t ON ura."teamId" = t.id
WHERE u.email = 'newuser6@example.com'
AND ura."teamId" = 'd47e3498-2000-4123-95e0-bc9ec3d10f4a';
