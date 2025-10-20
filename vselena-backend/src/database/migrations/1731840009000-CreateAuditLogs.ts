import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAuditLogs1731840009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            name: 'service',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resourceId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'requestData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'responseData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'statusCode',
            type: 'int',
            default: 200,
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
            name: 'userRoles',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'userPermissions',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'teamId',
            type: 'uuid',
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
      }),
      true,
    );

    // Создаем индексы для оптимизации запросов
    await queryRunner.query('CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("userId")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_service" ON "audit_logs" ("service")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("createdAt")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_user_service" ON "audit_logs" ("userId", "service")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_user_created" ON "audit_logs" ("userId", "createdAt")');

    // Добавляем внешний ключ
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "FK_audit_logs_user_id" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
