import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUsers1731840011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли колонка phone
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phone'
    `);
    
    if (columnExists.length > 0) {
      console.log('Phone column already exists, skipping creation');
      return;
    }

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
