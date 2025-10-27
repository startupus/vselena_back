import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToOrganizationsAndTeams1731840012001 implements MigrationInterface {
  name = 'AddCreatedByToOrganizationsAndTeams1731840012001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем поле created_by в таблицу organizations
    await queryRunner.query(`
      ALTER TABLE organizations 
      ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    // Добавляем поле created_by в таблицу teams
    await queryRunner.query(`
      ALTER TABLE teams 
      ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    // Создаем индексы для новых полей
    await queryRunner.query(`
      CREATE INDEX idx_organizations_created_by ON organizations(created_by)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_teams_created_by ON teams(created_by)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем индексы
    await queryRunner.query(`DROP INDEX IF EXISTS idx_teams_created_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_created_by`);

    // Удаляем поля
    await queryRunner.query(`ALTER TABLE teams DROP COLUMN IF EXISTS created_by`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS created_by`);
  }
}


