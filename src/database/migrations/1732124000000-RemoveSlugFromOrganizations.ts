import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSlugFromOrganizations1732124000000 implements MigrationInterface {
  name = 'RemoveSlugFromOrganizations1732124000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем constraint для slug
    await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "UQ_963693341bd612aa01ddf3a4b68"`);
    
    // Удаляем колонку slug
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "slug"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Добавляем колонку slug обратно
    await queryRunner.query(`ALTER TABLE "organizations" ADD "slug" varchar(100)`);
    
    // Создаем уникальный индекс для slug
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_963693341bd612aa01ddf3a4b68" ON "organizations" ("slug")`);
  }
}
