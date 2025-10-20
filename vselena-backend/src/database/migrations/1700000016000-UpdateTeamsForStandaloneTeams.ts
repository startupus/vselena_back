import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTeamsForStandaloneTeams1700000016000 implements MigrationInterface {
  name = 'UpdateTeamsForStandaloneTeams1700000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Делаем organizationId nullable для поддержки самостоятельных команд
    await queryRunner.query(`
      ALTER TABLE teams 
      ALTER COLUMN organization_id DROP NOT NULL
    `);

    // Добавляем комментарий к колонке для ясности
    await queryRunner.query(`
      COMMENT ON COLUMN teams.organization_id IS 'ID организации (NULL для самостоятельных команд)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возвращаем NOT NULL ограничение
    // ВНИМАНИЕ: Это может вызвать ошибку, если есть команды с NULL organization_id
    await queryRunner.query(`
      ALTER TABLE teams 
      ALTER COLUMN organization_id SET NOT NULL
    `);

    // Удаляем комментарий
    await queryRunner.query(`
      COMMENT ON COLUMN teams.organization_id IS NULL
    `);
  }
}


