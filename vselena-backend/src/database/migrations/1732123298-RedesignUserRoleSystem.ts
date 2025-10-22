import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesignUserRoleSystem1732123298 implements MigrationInterface {
  name = 'RedesignUserRoleSystem1732123298';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем старые колонки из users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "teamId"`);
    
    // Удаляем старые колонки из roles
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "teamId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Восстанавливаем колонки в users
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "organizationId" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "teamId" uuid`);
    
    // Восстанавливаем колонки в roles
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN "organizationId" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN "teamId" uuid`);
  }
}