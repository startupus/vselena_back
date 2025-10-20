import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeamStandalonePermissions1700000017 implements MigrationInterface {
  name = 'AddTeamStandalonePermissions1700000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем новые права для команд
    await queryRunner.query(`
      INSERT INTO permissions (id, name, description, resource, action) VALUES 
      (gen_random_uuid(), 'teams.create_standalone', 'Создание самостоятельных команд (не привязанных к организации)', 'teams', 'create_standalone'),
      (gen_random_uuid(), 'teams.create_organization', 'Создание команд внутри организации', 'teams', 'create_organization')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные права
    await queryRunner.query(`
      DELETE FROM permissions 
      WHERE name IN ('teams.create_standalone', 'teams.create_organization')
    `);
  }
}
