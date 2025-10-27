-- Получаем ID пользователя и роли
DO $$
DECLARE
    v_user_id uuid;
    v_role_id uuid;
BEGIN
    -- Находим ID пользователя admin
    SELECT id INTO v_user_id FROM users WHERE email = 'admin@vselena.ru';
    
    -- Находим ID роли super_admin
    SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
    
    -- Вставляем связь пользователь-роль
    INSERT INTO user_roles ("userId", "roleId", "grantedAt")
    VALUES (v_user_id, v_role_id, NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Role assigned successfully. User: %, Role: %', v_user_id, v_role_id;
END $$;

-- Проверяем результат
SELECT u.email, r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur."userId"
LEFT JOIN roles r ON ur."roleId" = r.id
WHERE u.email = 'admin@vselena.ru';
