import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEmailVerificationTokens1731840009004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_EMAIL_VERIFICATION_TOKEN',
            columnNames: ['token'],
          },
          {
            name: 'IDX_EMAIL_VERIFICATION_USER',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_EMAIL_VERIFICATION_EMAIL',
            columnNames: ['email'],
          },
          {
            name: 'IDX_EMAIL_VERIFICATION_EXPIRES',
            columnNames: ['expiresAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verification_tokens');
  }
}


