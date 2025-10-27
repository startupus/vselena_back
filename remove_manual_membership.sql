-- Удаляем ручную запись, которую мы создали для тестирования
DELETE FROM team_memberships 
WHERE "userId" = (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru')
  AND "teamId" = '13b199ca-1a51-4184-ae97-80edcded954d';
