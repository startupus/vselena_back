import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRolesWithOrganizationsPermissions1700000015000 implements MigrationInterface {
  name = 'UpdateRolesWithOrganizationsPermissions1700000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Получаем ID ролей
    const superAdminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'super_admin'`);
    const adminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const managerRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'manager'`);
    const editorRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'editor'`);
    const viewerRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'viewer'`);

    // Получаем ID новых прав
    const organizationsCreate = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'organizations.create'`);
    const organizationsRead = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'organizations.read'`);
    const organizationsUpdate = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'organizations.update'`);
    const organizationsDelete = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'organizations.delete'`);
    const teamsRead = await queryRunner.query(`SELECT id FROM permissions WHERE name = 'teams.read'`);

    // SUPER_ADMIN - добавляем все права организаций (если еще нет)
    if (superAdminRole.length > 0 && organizationsCreate.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, organizationsCreate[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, organizationsRead[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, organizationsUpdate[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [superAdminRole[0].id, organizationsDelete[0].id]);
    }

    // ADMIN - добавляем все права организаций
    if (adminRole.length > 0 && organizationsCreate.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, organizationsCreate[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, organizationsRead[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, organizationsUpdate[0].id]);

      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [adminRole[0].id, organizationsDelete[0].id]);
    }

    // MANAGER - добавляем только organizations.read и teams.read
    if (managerRole.length > 0 && organizationsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [managerRole[0].id, organizationsRead[0].id]);
    }

    if (managerRole.length > 0 && teamsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [managerRole[0].id, teamsRead[0].id]);
    }

    // EDITOR - добавляем только organizations.read и teams.read
    if (editorRole.length > 0 && organizationsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [editorRole[0].id, organizationsRead[0].id]);
    }

    if (editorRole.length > 0 && teamsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [editorRole[0].id, teamsRead[0].id]);
    }

    // VIEWER - добавляем только organizations.read и teams.read
    if (viewerRole.length > 0 && organizationsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [viewerRole[0].id, organizationsRead[0].id]);
    }

    if (viewerRole.length > 0 && teamsRead.length > 0) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId") 
        SELECT $1, $2 WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2
        )
      `, [viewerRole[0].id, teamsRead[0].id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные права из ролей
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE "permissionId" IN (
        SELECT id FROM permissions 
        WHERE name IN ('organizations.create', 'organizations.read', 'organizations.update', 'organizations.delete', 'teams.read')
      )
    `);
  }
}


