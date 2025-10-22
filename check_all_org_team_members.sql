SELECT 
    u.email,
    t.name AS team_name,
    t.id AS team_id
FROM users u
JOIN user_teams ut ON u.id = ut.user_id
JOIN teams t ON ut.team_id = t.id
WHERE t."organizationId" = 'ea9e8b25-3b7c-40ef-8a94-6f0ae6e96391'
ORDER BY t.name, u.email;
