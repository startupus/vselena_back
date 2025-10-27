import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserRoleAssignments1761340259370 implements MigrationInterface {
  name = 'CreateUserRoleAssignments1761340259370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_role_assignments'
      )
    `);
    
    if (tableExists[0].exists) {
      console.log('Table user_role_assignments already exists, skipping creation');
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_role_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'roleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'organizationRoleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'teamRoleId',
            type: 'uuid',
            isNullable: true,
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
            name: 'assignedBy',
            type: 'uuid',
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
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Внешние ключи
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD CONSTRAINT "FK_user_role_assignments_global_role" 
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_role_assignments');
  }
}

