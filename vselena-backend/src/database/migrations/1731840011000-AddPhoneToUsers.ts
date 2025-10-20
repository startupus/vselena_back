import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUsers1731840011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "phone" VARCHAR(20) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "phone"
    `);
  }
}
