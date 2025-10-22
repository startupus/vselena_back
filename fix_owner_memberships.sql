-- Удаляем владельца из всех команд
-- Владелец должен принадлежать только организации, а не командам

-- Получаем ID владельца
WITH owner_info AS (
  SELECT id as owner_id, email
  FROM users 
  WHERE email = 'saschkaproshka04@mail.ru'
)

-- Удаляем владельца из всех команд
DELETE FROM user_teams 
WHERE user_id = (SELECT owner_id FROM owner_info);

-- Показываем результат
SELECT 
  u.email,
  'ORGANIZATION MEMBER' as membership_type,
  o.name as organization_name
FROM users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'saschkaproshka04@mail.ru'

UNION ALL

SELECT 
  u.email,
  'TEAM MEMBER' as membership_type,
  t.name as team_name
FROM users u
JOIN user_teams ut ON u.id = ut.user_id
JOIN teams t ON ut.team_id = t.id
WHERE u.email = 'saschkaproshka04@mail.ru';
