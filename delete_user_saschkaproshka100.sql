-- Скрипт для удаления пользователя saschkaproshka100@mail.ru
-- ВНИМАНИЕ: Этот скрипт удалит пользователя и все связанные данные!

-- 1. Сначала проверим, что пользователь существует
SELECT id, email, first_name, last_name, created_at 
FROM users 
WHERE email = 'saschkaproshka100@mail.ru';

-- 2. Удаляем все связанные данные в правильном порядке (сначала дочерние записи)

-- Удаляем refresh tokens
DELETE FROM refresh_tokens 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем уведомления
DELETE FROM notifications 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем назначения ролей
DELETE FROM user_role_assignments 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем связи пользователя с командами
DELETE FROM user_teams 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем связи пользователя с организациями
DELETE FROM user_organizations 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем приглашения, созданные этим пользователем
DELETE FROM invitations 
WHERE invited_by_id IN (
    SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- Удаляем приглашения, отправленные этому пользователю
DELETE FROM invitations 
WHERE email = 'saschkaproshka100@mail.ru';

-- 3. Наконец, удаляем самого пользователя
DELETE FROM users 
WHERE email = 'saschkaproshka100@mail.ru';

-- 4. Проверяем, что пользователь удален
SELECT 'Пользователь удален' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'saschkaproshka100@mail.ru'
);

-- 5. Показываем статистику удаления
SELECT 
    'Удалено записей:' as info,
    (SELECT COUNT(*) FROM users WHERE email = 'saschkaproshka100@mail.ru') as users_remaining,
    'Ожидается: 0' as expected;
