-- Проверяем, есть ли роль в команде
SELECT tr.id, tr.name, tr."teamId", t.name as team_name
FROM team_roles tr
LEFT JOIN teams t ON tr."teamId" = t.id
WHERE tr.id = 'a8bb2b5b-6515-4ae0-b66a-6dbbd2de5f27';

-- Проверяем, есть ли роль с таким именем в команде
SELECT tr.id, tr.name, tr."teamId", t.name as team_name
FROM team_roles tr
LEFT JOIN teams t ON tr."teamId" = t.id
WHERE tr."teamId" = '13b199ca-1a51-4184-ae97-80edcded954d';
