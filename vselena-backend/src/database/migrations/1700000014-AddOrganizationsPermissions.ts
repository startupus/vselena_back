import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationsPermissions1700000014 implements MigrationInterface {
  name = 'AddOrganizationsPermissions1700000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем новые права для организаций
    await queryRunner.query(`
      INSERT INTO permissions (id, name, description, resource, action) VALUES 
      (gen_random_uuid(), 'organizations.create', 'Создание организаций', 'organizations', 'create'),
      (gen_random_uuid(), 'organizations.read', 'Просмотр организаций', 'organizations', 'read'),
      (gen_random_uuid(), 'organizations.update', 'Редактирование организаций', 'organizations', 'update'),
      (gen_random_uuid(), 'organizations.delete', 'Удаление организаций', 'organizations', 'delete')
    `);

    // Добавляем право teams.read (если его еще нет)
    await queryRunner.query(`
      INSERT INTO permissions (id, name, description, resource, action) 
      SELECT gen_random_uuid(), 'teams.read', 'Просмотр команд', 'teams', 'read'
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'teams.read')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные права
    await queryRunner.query(`
      DELETE FROM permissions 
      WHERE name IN ('organizations.create', 'organizations.read', 'organizations.update', 'organizations.delete', 'teams.read')
    `);
  }
}
