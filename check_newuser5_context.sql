SELECT 
    u.email,
    o.name AS organization_name,
    o.id AS organization_id,
    t.name AS team_name,
    t.id AS team_id
FROM users u
LEFT JOIN user_organizations uo ON u.id = uo.user_id
LEFT JOIN organizations o ON uo.organization_id = o.id
LEFT JOIN user_teams ut ON u.id = ut.user_id
LEFT JOIN teams t ON ut.team_id = t.id
WHERE u.email = 'newuser5@example.com';
