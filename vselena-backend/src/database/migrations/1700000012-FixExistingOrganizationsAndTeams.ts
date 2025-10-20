import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixExistingOrganizationsAndTeams1700000012 implements MigrationInterface {
  name = 'FixExistingOrganizationsAndTeams1700000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Добавляем существующие организации в user_organizations
    // Находим все организации, которые не имеют связи с пользователями
    await queryRunner.query(`
      INSERT INTO user_organizations (user_id, organization_id, created_at, updated_at)
      SELECT DISTINCT 
        u.id as user_id,
        o.id as organization_id,
        NOW() as created_at,
        NOW() as updated_at
      FROM organizations o
      CROSS JOIN users u
      WHERE u.organization_id = o.id
        AND NOT EXISTS (
          SELECT 1 FROM user_organizations uo 
          WHERE uo.user_id = u.id AND uo.organization_id = o.id
        )
    `);

    // 2. Добавляем существующие команды в user_teams
    // Находим все команды, которые не имеют связи с пользователями
    await queryRunner.query(`
      INSERT INTO user_teams (user_id, team_id, created_at, updated_at)
      SELECT DISTINCT 
        u.id as user_id,
        t.id as team_id,
        NOW() as created_at,
        NOW() as updated_at
      FROM teams t
      CROSS JOIN users u
      WHERE u.team_id = t.id
        AND NOT EXISTS (
          SELECT 1 FROM user_teams ut 
          WHERE ut.user_id = u.id AND ut.team_id = t.id
        )
    `);

    // 3. Добавляем создателей организаций в user_organizations
    // Если у организации есть created_by, добавляем его как участника
    await queryRunner.query(`
      INSERT INTO user_organizations (user_id, organization_id, created_at, updated_at)
      SELECT DISTINCT 
        o.created_by as user_id,
        o.id as organization_id,
        NOW() as created_at,
        NOW() as updated_at
      FROM organizations o
      WHERE o.created_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM user_organizations uo 
          WHERE uo.user_id = o.created_by AND uo.organization_id = o.id
        )
    `);

    // 4. Добавляем создателей команд в user_teams
    // Если у команды есть created_by, добавляем его как участника
    await queryRunner.query(`
      INSERT INTO user_teams (user_id, team_id, created_at, updated_at)
      SELECT DISTINCT 
        t.created_by as user_id,
        t.id as team_id,
        NOW() as created_at,
        NOW() as updated_at
      FROM teams t
      WHERE t.created_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM user_teams ut 
          WHERE ut.user_id = t.created_by AND ut.team_id = t.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные связи
    await queryRunner.query(`
      DELETE FROM user_organizations 
      WHERE created_at >= NOW() - INTERVAL '1 minute'
    `);
    
    await queryRunner.query(`
      DELETE FROM user_teams 
      WHERE created_at >= NOW() - INTERVAL '1 minute'
    `);
  }
}
