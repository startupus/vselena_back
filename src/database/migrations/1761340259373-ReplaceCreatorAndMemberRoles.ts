import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceCreatorAndMemberRoles1761340259373 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Replacing creator and member roles...');

    // 1. Обновляем роль 'creator' на 'super_admin' в organization_roles
    await queryRunner.query(`
      UPDATE organization_roles
      SET name = 'super_admin',
          description = 'Суперадминистратор организации',
          level = 100
      WHERE name = 'creator'
    `);
    console.log('✅ Updated creator → super_admin in organization_roles');

    // 2. Обновляем роль 'member' на 'viewer' в organization_roles
    await queryRunner.query(`
      UPDATE organization_roles
      SET name = 'viewer',
          description = 'Наблюдатель организации',
          level = 20
      WHERE name = 'member'
    `);
    console.log('✅ Updated member → viewer in organization_roles');

    // 3. Обновляем роль 'member' на 'viewer' в team_roles
    await queryRunner.query(`
      UPDATE team_roles
      SET name = 'viewer',
          description = 'Наблюдатель команды',
          level = 20
      WHERE name = 'member'
    `);
    console.log('✅ Updated member → viewer in team_roles');

    // 4. Проверяем, что не осталось дубликатов
    // Если уже есть super_admin, удаляем старый creator
    await queryRunner.query(`
      DELETE FROM organization_roles
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY "organizationId", name ORDER BY "createdAt" DESC) as rn
          FROM organization_roles
          WHERE name = 'super_admin'
        ) t
        WHERE t.rn > 1
      )
    `);
    console.log('✅ Removed duplicate super_admin roles in organizations');

    // Если уже есть viewer, удаляем старый member
    await queryRunner.query(`
      DELETE FROM organization_roles
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY "organizationId", name ORDER BY "createdAt" DESC) as rn
          FROM organization_roles
          WHERE name = 'viewer'
        ) t
        WHERE t.rn > 1
      )
    `);
    console.log('✅ Removed duplicate viewer roles in organizations');

    await queryRunner.query(`
      DELETE FROM team_roles
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY "teamId", name ORDER BY "createdAt" DESC) as rn
          FROM team_roles
          WHERE name = 'viewer'
        ) t
        WHERE t.rn > 1
      )
    `);
    console.log('✅ Removed duplicate viewer roles in teams');

    console.log('🎉 Migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат миграции: возвращаем обратно
    await queryRunner.query(`
      UPDATE organization_roles
      SET name = 'creator',
          description = 'Создатель организации',
          level = 100
      WHERE name = 'super_admin' AND "isSystem" = true
    `);

    await queryRunner.query(`
      UPDATE organization_roles
      SET name = 'member',
          description = 'Участник организации',
          level = 20
      WHERE name = 'viewer' AND "isSystem" = true
    `);

    await queryRunner.query(`
      UPDATE team_roles
      SET name = 'member',
          description = 'Участник команды',
          level = 20
      WHERE name = 'viewer' AND "isSystem" = true
    `);
  }
}

