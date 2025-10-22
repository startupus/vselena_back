import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesignUserRoleSystem1700000012 implements MigrationInterface {
  name = 'RedesignUserRoleSystem1700000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем старые колонки из users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "teamId"`);

    // Удаляем старую таблицу user_roles
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);

    // Создаем новую таблицу user_role_assignments
    await queryRunner.query(`
      CREATE TABLE "user_role_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "organizationId" uuid,
        "teamId" uuid,
        "assignedBy" uuid,
        "expiresAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_role_assignments" PRIMARY KEY ("id")
      )
    `);

    // Добавляем внешние ключи
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_role" 
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_organization" 
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_team" 
      FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_assigned_by" 
      FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Создаем индексы
    await queryRunner.query(`
      CREATE INDEX "IDX_user_role_assignments_user" ON "user_role_assignments" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_role_assignments_role" ON "user_role_assignments" ("roleId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_role_assignments_organization" ON "user_role_assignments" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_role_assignments_team" ON "user_role_assignments" ("teamId")
    `);

    // Уникальный индекс для предотвращения дублирования
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_role_assignments_unique" 
      ON "user_role_assignments" ("userId", "roleId", "organizationId", "teamId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем новую таблицу
    await queryRunner.query(`DROP TABLE IF EXISTS "user_role_assignments"`);

    // Восстанавливаем старые колонки
    await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "teamId" uuid`);

    // Восстанавливаем старую таблицу user_roles
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("userId", "roleId")
      )
    `);
  }
}
