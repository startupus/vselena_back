import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRolesWithTeamStandalonePermissions1700000018 implements MigrationInterface {
  name = 'UpdateRolesWithTeamStandalonePermissions1700000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Получаем ID ролей
    const superAdminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'super_admin'`);
    const adminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const managerRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'manager'`);

    // Получаем ID новых прав
    const teamsCreateStandalone = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'teams.create_standalone'`);
    const teamsCreateOrganization = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'teams.create_organization'`);

    // SUPER_ADMIN - добавляем все права команд
    if (superAdminRole.length > 0 && teamsCreateStandalone.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, teamsCreateStandalone[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, teamsCreateOrganization[0].id]);
    }

    // ADMIN - добавляем все права команд
    if (adminRole.length > 0 && teamsCreateStandalone.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, teamsCreateStandalone[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, teamsCreateOrganization[0].id]);
    }

    // MANAGER - добавляем только право создавать команды внутри организации
    if (managerRole.length > 0 && teamsCreateOrganization.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [managerRole[0].id, teamsCreateOrganization[0].id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные права из ролей
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE "permissionId" IN (
        SELECT id FROM permissions 
        WHERE name IN ('teams.create_standalone', 'teams.create_organization')
      )
    `);
  }
}
