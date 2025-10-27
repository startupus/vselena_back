import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoleAssignments1761340259374 implements MigrationInterface {
  name = 'UpdateUserRoleAssignments1761340259374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем существование таблицы
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_role_assignments'
      )
    `);
    
    if (!tableExists[0].exists) {
      console.log('Table user_role_assignments does not exist, skipping migration');
      return;
    }
    
    // Добавляем новые колонки для ссылок на organization_roles и team_roles
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD COLUMN IF NOT EXISTS "organizationRoleId" UUID,
      ADD COLUMN IF NOT EXISTS "teamRoleId" UUID
    `);

    // Добавляем внешние ключи с проверкой существования
    const constraint1Exists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_role_assignments_organization_role'
      )
    `);
    
    if (!constraint1Exists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "user_role_assignments" 
        ADD CONSTRAINT "FK_user_role_assignments_organization_role" 
        FOREIGN KEY ("organizationRoleId") REFERENCES "organization_roles"("id") ON DELETE CASCADE
      `);
    }

    const constraint2Exists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_role_assignments_team_role'
      )
    `);
    
    if (!constraint2Exists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "user_role_assignments" 
        ADD CONSTRAINT "FK_user_role_assignments_team_role" 
        FOREIGN KEY ("teamRoleId") REFERENCES "team_roles"("id") ON DELETE CASCADE
      `);
    }

    // Добавляем индексы с проверкой существования
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_organization_role" 
      ON "user_role_assignments" ("organizationRoleId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_team_role" 
      ON "user_role_assignments" ("teamRoleId")
    `);

    // Добавляем проверку, что только одна из ролей может быть назначена
    const checkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CHK_user_role_assignments_single_role'
      )
    `);
    
    if (!checkExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "user_role_assignments" 
        ADD CONSTRAINT "CHK_user_role_assignments_single_role" 
        CHECK (
          ("roleId" IS NOT NULL AND "organizationRoleId" IS NULL AND "teamRoleId" IS NULL) OR
          ("roleId" IS NULL AND "organizationRoleId" IS NOT NULL AND "teamRoleId" IS NULL) OR
          ("roleId" IS NULL AND "organizationRoleId" IS NULL AND "teamRoleId" IS NOT NULL)
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем ограничения
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      DROP CONSTRAINT "CHK_user_role_assignments_single_role"
    `);

    // Удаляем индексы
    await queryRunner.query(`
      DROP INDEX "IDX_user_role_assignments_team_role"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_user_role_assignments_organization_role"
    `);

    // Удаляем внешние ключи
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      DROP CONSTRAINT "FK_user_role_assignments_team_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      DROP CONSTRAINT "FK_user_role_assignments_organization_role"
    `);

    // Удаляем колонки
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      DROP COLUMN "teamRoleId",
      DROP COLUMN "organizationRoleId"
    `);
  }
}
