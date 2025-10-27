import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReferrals1731840012003 implements MigrationInterface {
  name = 'CreateReferrals1731840012003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals'
      )
    `);
    
    if (tableExists[0].exists) {
      console.log('Table referrals already exists, skipping creation');
      return;
    }

    // Создаем таблицу referrals
    await queryRunner.query(`
      CREATE TABLE referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        referral_code VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
        converted_at TIMESTAMP,
        expires_at TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Создаем индексы для оптимизации запросов
    await queryRunner.query(`
      CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_referrals_referral_code ON referrals(referral_code)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_referrals_status ON referrals(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_referrals_expires_at ON referrals(expires_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_referrals_created_at ON referrals(created_at)
    `);

    // Добавляем комментарии к таблице и колонкам
    await queryRunner.query(`
      COMMENT ON TABLE referrals IS 'Реферальная система - связи между пользователями'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN referrals.referrer_id IS 'ID пользователя, который создал реферальную ссылку'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN referrals.referred_user_id IS 'ID пользователя, который перешел по реферальной ссылке'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN referrals.referral_code IS 'Уникальный код реферальной ссылки'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN referrals.status IS 'Статус реферальной ссылки: pending, converted, expired'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN referrals.metadata IS 'Дополнительные метаданные (количество кликов, конверсий и т.д.)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем таблицу referrals
    await queryRunner.query(`DROP TABLE referrals`);
  }
}
