import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMultiAuthTables1761341000001 implements MigrationInterface {
  name = 'CreateMultiAuthTables1761341000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем таблицу verification_codes
    await queryRunner.createTable(
      new Table({
        name: 'verification_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'identifier',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'authMethod',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'purpose',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Создаем таблицу account_merge_requests
    await queryRunner.createTable(
      new Table({
        name: 'account_merge_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'primaryUserId',
            type: 'uuid',
          },
          {
            name: 'secondaryUserId',
            type: 'uuid',
          },
          {
            name: 'authMethod',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'conflicts',
            type: 'jsonb',
          },
          {
            name: 'resolution',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
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
        foreignKeys: [
          {
            columnNames: ['primaryUserId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['secondaryUserId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Создаем индексы для verification_codes
    await queryRunner.query(`
      CREATE INDEX "IDX_verification_codes_identifier_auth_purpose" 
      ON "verification_codes" ("identifier", "authMethod", "purpose")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_verification_codes_code_used" 
      ON "verification_codes" ("code", "isUsed")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_verification_codes_expires_at" 
      ON "verification_codes" ("expiresAt")
    `);

    // Создаем индексы для account_merge_requests
    await queryRunner.query(`
      CREATE INDEX "IDX_account_merge_requests_status" 
      ON "account_merge_requests" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_merge_requests_expires_at" 
      ON "account_merge_requests" ("expiresAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_merge_requests_primary_user" 
      ON "account_merge_requests" ("primaryUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_merge_requests_secondary_user" 
      ON "account_merge_requests" ("secondaryUserId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем таблицы в обратном порядке
    await queryRunner.dropTable('account_merge_requests');
    await queryRunner.dropTable('verification_codes');
  }
}
