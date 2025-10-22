DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM user_role_assignments WHERE user_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM user_teams WHERE user_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM user_organizations WHERE user_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM invitations WHERE invited_by_id IN (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru');
DELETE FROM invitations WHERE email = 'saschkaproshka100@mail.ru';
DELETE FROM users WHERE email = 'saschkaproshka100@mail.ru';
