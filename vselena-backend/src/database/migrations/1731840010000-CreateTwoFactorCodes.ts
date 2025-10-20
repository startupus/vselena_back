import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateTwoFactorCodes1731840010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'two_factor_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['email', 'sms'],
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '6',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'verified', 'expired', 'used'],
            default: "'pending'",
          },
          {
            name: 'contact',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'maxAttempts',
            type: 'int',
            default: 3,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Создаем индексы для оптимизации запросов
    await queryRunner.query('CREATE INDEX "idx_two_factor_codes_user_type_status" ON "two_factor_codes" ("userId", "type", "status")');
    await queryRunner.query('CREATE INDEX "idx_two_factor_codes_code_status" ON "two_factor_codes" ("code", "status")');
    await queryRunner.query('CREATE INDEX "idx_two_factor_codes_expires_at" ON "two_factor_codes" ("expiresAt")');
    await queryRunner.query('CREATE INDEX "idx_two_factor_codes_contact" ON "two_factor_codes" ("contact")');
    await queryRunner.query('CREATE INDEX "idx_two_factor_codes_created_at" ON "two_factor_codes" ("createdAt")');

    // Добавляем внешний ключ
    await queryRunner.query(`
      ALTER TABLE "two_factor_codes" 
      ADD CONSTRAINT "FK_two_factor_codes_user_id" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('two_factor_codes');
  }
}
