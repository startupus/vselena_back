import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLevelToRoles1761340259372 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем поле level к organization_roles
    await queryRunner.addColumn(
      'organization_roles',
      new TableColumn({
        name: 'level',
        type: 'int',
        default: 0,
      }),
    );

    // Добавляем поле level к team_roles
    await queryRunner.addColumn(
      'team_roles',
      new TableColumn({
        name: 'level',
        type: 'int',
        default: 0,
      }),
    );

    // Обновляем уровни для существующих ролей в organization_roles
    await queryRunner.query(`
      UPDATE organization_roles
      SET level = CASE name
        WHEN 'super_admin' THEN 100
        WHEN 'admin' THEN 80
        WHEN 'manager' THEN 60
        WHEN 'editor' THEN 40
        WHEN 'viewer' THEN 20
        WHEN 'creator' THEN 100
        WHEN 'member' THEN 20
        ELSE 0
      END
    `);

    // Обновляем уровни для существующих ролей в team_roles
    await queryRunner.query(`
      UPDATE team_roles
      SET level = CASE name
        WHEN 'super_admin' THEN 100
        WHEN 'admin' THEN 80
        WHEN 'manager' THEN 60
        WHEN 'editor' THEN 40
        WHEN 'viewer' THEN 20
        WHEN 'member' THEN 20
        ELSE 0
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем поле level из organization_roles
    await queryRunner.dropColumn('organization_roles', 'level');

    // Удаляем поле level из team_roles
    await queryRunner.dropColumn('team_roles', 'level');
  }
}

