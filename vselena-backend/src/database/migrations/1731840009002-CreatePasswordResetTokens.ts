import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1731840009002 implements MigrationInterface {
  name = 'CreatePasswordResetTokens1731840009002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      )
    `);
    
    if (tableExists[0].exists) {
      console.log('Table password_reset_tokens already exists, skipping creation');
      return;
    }

    // Создаем таблицу для токенов восстановления пароля
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "token" VARCHAR(255) UNIQUE NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Добавляем внешний ключ
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens" 
      ADD CONSTRAINT "FK_password_reset_tokens_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Создаем индексы для быстрого поиска
    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_userId" ON "password_reset_tokens" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_expiresAt" ON "password_reset_tokens" ("expiresAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем индексы
    await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_token"`);

    // Удаляем таблицу
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
