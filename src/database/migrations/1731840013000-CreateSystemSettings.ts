import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettings1731840013000 implements MigrationInterface {
  name = 'CreateSystemSettings1731840013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
      )
    `);
    
    if (tableExists[0].exists) {
      console.log('Table system_settings already exists, skipping creation');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description VARCHAR(255),
        type VARCHAR(50) NOT NULL DEFAULT 'string',
        "isSystem" BOOLEAN NOT NULL DEFAULT false,
        "isEditable" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Создаем индексы
    await queryRunner.query(`CREATE INDEX idx_system_settings_key ON system_settings("key")`);
    await queryRunner.query(`CREATE INDEX idx_system_settings_type ON system_settings("type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS system_settings`);
  }
}

