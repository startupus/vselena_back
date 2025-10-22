SELECT 
    u.email, 
    o.name as org_name, 
    t.name as team_name 
FROM users u 
LEFT JOIN user_organizations uo ON u.id = uo.user_id 
LEFT JOIN organizations o ON uo.organization_id = o.id 
LEFT JOIN user_teams ut ON u.id = ut.user_id 
LEFT JOIN teams t ON ut.team_id = t.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
