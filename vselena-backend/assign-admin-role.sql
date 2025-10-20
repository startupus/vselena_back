-- Назначаем роль admin тестовому пользователю
INSERT INTO user_roles ("userId", "roleId")
SELECT 
  '3f93840d-6b19-49e2-b3a8-91385eb4d3f1',
  id
FROM roles 
WHERE name = 'admin';

-- Проверяем результат
SELECT u.email, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur."userId"
LEFT JOIN roles r ON ur."roleId" = r.id
WHERE u.email = 'testadmin@example.com';
