-- Создаем тестовое приглашение для admin@vselena.ru
INSERT INTO invitations (
    id,
    email,
    "firstName",
    "lastName",
    type,
    "organizationId",
    "teamId",
    status,
    "roleId",
    "invitedById",
    "acceptedById",
    token,
    "expiresAt",
    "acceptedAt",
    metadata,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'admin@vselena.ru',
    'Админ',
    'Тест',
    'organization',
    NULL,
    NULL,
    'pending',
    NULL,
    '00000000-0000-0000-0000-000000000001', -- admin@vselena.ru приглашает сам себя
    NULL,
    'test-token-' || extract(epoch from now()),
    NOW() + INTERVAL '7 days',
    NULL,
    '{"message": "Тестовое приглашение для проверки системы"}',
    NOW(),
    NOW()
);
