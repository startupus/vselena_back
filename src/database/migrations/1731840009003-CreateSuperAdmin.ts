import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuperAdmin1731840009003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем супер-админа
    await queryRunner.query(`
      INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "emailVerified", "createdAt", "updatedAt")
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin@vselena.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4VZJqJqJqJ', -- admin123
        'Супер',
        'Админ',
        true,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // Назначаем роль super_admin
    await queryRunner.query(`
      INSERT INTO user_roles ("userId", "roleId")
      SELECT 
        '00000000-0000-0000-0000-000000000001',
        r.id
      FROM roles r 
      WHERE r.name = 'super_admin'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur."userId" = '00000000-0000-0000-0000-000000000001' 
        AND ur."roleId" = r.id
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем супер-админа
    await queryRunner.query(`
      DELETE FROM user_roles WHERE "userId" = '00000000-0000-0000-0000-000000000001';
    `);
    
    await queryRunner.query(`
      DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
    `);
  }
}
