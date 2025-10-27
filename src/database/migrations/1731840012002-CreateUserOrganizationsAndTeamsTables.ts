import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserOrganizationsAndTeamsTables1731840012002 implements MigrationInterface {
  name = 'CreateUserOrganizationsAndTeamsTables1731840012002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существуют ли таблицы
    const userOrgsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_organizations'
      )
    `);
    
    const userTeamsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_teams'
      )
    `);
    
    if (userOrgsExists[0].exists && userTeamsExists[0].exists) {
      console.log('Tables user_organizations and user_teams already exist, skipping creation');
      return;
    }

    // Создаем таблицу user_organizations
    await queryRunner.query(`
      CREATE TABLE user_organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "organizationId" UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "organizationId")
      )
    `);

    // Создаем таблицу user_teams
    await queryRunner.query(`
      CREATE TABLE user_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "teamId" UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "teamId")
      )
    `);

    // Создаем индексы
    await queryRunner.query(`
      CREATE INDEX idx_user_organizations_user ON user_organizations("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_organizations_organization ON user_organizations("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_teams_user ON user_teams("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_teams_team ON user_teams("teamId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем индексы
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_teams_team`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_teams_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_organizations_organization`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_organizations_user`);

    // Удаляем таблицы
    await queryRunner.query(`DROP TABLE IF EXISTS user_teams`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_organizations`);
  }
}


