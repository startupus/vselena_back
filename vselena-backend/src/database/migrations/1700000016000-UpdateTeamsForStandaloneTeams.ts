import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTeamsForStandaloneTeams1700000016000 implements MigrationInterface {
  name = 'UpdateTeamsForStandaloneTeams1700000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Делаем organizationId nullable для поддержки самостоятельных команд
    await queryRunner.query(`
      ALTER TABLE teams 
      ALTER COLUMN "organizationId" DROP NOT NULL
    `);

    // Добавляем комментарий к колонке для ясности
    await queryRunner.query(`
      COMMENT ON COLUMN teams."organizationId" IS 'ID организации (NULL для самостоятельных команд)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возвращаем NOT NULL ограничение
    // ВНИМАНИЕ: Это может вызвать ошибку, если есть команды с NULL organizationId
    await queryRunner.query(`
      ALTER TABLE teams 
      ALTER COLUMN "organizationId" SET NOT NULL
    `);

    // Удаляем комментарий
    await queryRunner.query(`
      COMMENT ON COLUMN teams."organizationId" IS NULL
    `);
  }
}


