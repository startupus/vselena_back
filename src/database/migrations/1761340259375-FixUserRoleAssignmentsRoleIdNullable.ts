import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserRoleAssignmentsRoleIdNullable1761340259375 implements MigrationInterface {
  name = 'FixUserRoleAssignmentsRoleIdNullable1761340259375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем существование таблицы
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_role_assignments'
      )
    `);
    
    if (!tableExists[0].exists) {
      console.log('Table user_role_assignments does not exist, skipping migration');
      return;
    }
    
    // Удаляем NOT NULL ограничение с колонки roleId
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ALTER COLUMN "roleId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возвращаем NOT NULL ограничение
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ALTER COLUMN "roleId" SET NOT NULL
    `);
  }
}
