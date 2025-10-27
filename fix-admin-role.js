const { Client } = require('pg');

async function fixAdminRole() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'loginus',
    password: 'loginus_secret',
    database: 'loginus_dev'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Находим пользователя
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['saschkaproshka04@mail.ru']
    );

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log('User ID:', userId);

    // Находим роль admin
    const roleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1 AND is_global = true',
      ['admin']
    );

    if (roleResult.rows.length === 0) {
      console.log('Admin role not found');
      return;
    }

    const roleId = roleResult.rows[0].id;
    console.log('Role ID:', roleId);

    // Удаляем существующие роли пользователя
    await client.query(
      'DELETE FROM user_role_assignments WHERE "userId" = $1',
      [userId]
    );

    // Назначаем роль admin
    await client.query(
      'INSERT INTO user_role_assignments ("userId", "roleId", "assignedBy", "createdAt", "updatedAt") VALUES ($1, $2, $1, NOW(), NOW())',
      [userId, roleId]
    );

    console.log('Admin role assigned successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixAdminRole();
