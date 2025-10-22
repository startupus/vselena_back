UPDATE users SET "passwordHash" = '$2b$12$L0K6rJ8I0gX/xYMWGoiI4ub6bwYgo16WZ7.T0UN1uTozxtd5axIDe' WHERE email = 'admin@vselena.ru';

SELECT id, email, "firstName", "lastName", "isActive", "emailVerified" FROM users WHERE email = 'admin@vselena.ru';

