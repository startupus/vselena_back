-- Добавляем пользователя в команду с ролью editor
INSERT INTO team_memberships (
  id, 
  "userId", 
  "teamId", 
  "roleId", 
  "invitedBy", 
  "joinedAt", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '2a2922dd-ab87-4f3d-8ede-93c91d91747f', -- saschkaproshka100@mail.ru
  '13b199ca-1a51-4184-ae97-80edcded954d', -- команда 1
  'ec181d3b-2a94-4dd7-8167-221ab04c82df', -- роль editor в команде
  '42cddaab-1215-440b-8df2-870f0d89aaaf', -- saschkaproshka04@mail.ru
  NOW(),
  NOW(),
  NOW()
);