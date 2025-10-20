import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorSettings1731840009001 implements MigrationInterface {
  name = 'AddTwoFactorSettings1731840009001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существуют ли колонки 2FA
    const columnsExist = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('twoFactorEnabled', 'twoFactorMethods', 'phoneVerified', 'twoFactorSecret', 'backupCodes', 'twoFactorBackupCodesUsed')
    `);
    
    if (columnsExist.length > 0) {
      console.log('2FA columns already exist, skipping creation');
      return;
    }

    // Добавляем поля для настроек 2FA в таблицу users
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "twoFactorEnabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN "twoFactorMethods" text[] NOT NULL DEFAULT '{}',
      ADD COLUMN "phoneVerified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "twoFactorSecret" varchar(255),
      ADD COLUMN "backupCodes" text[],
      ADD COLUMN "twoFactorBackupCodesUsed" text[] DEFAULT '{}'
    `);

    // Создаем индексы для быстрого поиска
    await queryRunner.query(`
      CREATE INDEX "IDX_users_two_factor_enabled" ON "users" ("twoFactorEnabled")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email_verified" ON "users" ("emailVerified")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_phone_verified" ON "users" ("phoneVerified")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем индексы
    await queryRunner.query(`DROP INDEX "IDX_users_phone_verified"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email_verified"`);
    await queryRunner.query(`DROP INDEX "IDX_users_two_factor_enabled"`);

    // Удаляем колонки
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "twoFactorBackupCodesUsed",
      DROP COLUMN "backupCodes",
      DROP COLUMN "twoFactorSecret",
      DROP COLUMN "phoneVerified",
      DROP COLUMN "twoFactorMethods",
      DROP COLUMN "twoFactorEnabled"
    `);
  }
}
