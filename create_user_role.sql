INSERT INTO roles (id, name, description, "isSystem", "isGlobal")
VALUES (gen_random_uuid(), 'Пользователь', 'Обычный пользователь системы', true, true)
ON CONFLICT (name) DO NOTHING;
