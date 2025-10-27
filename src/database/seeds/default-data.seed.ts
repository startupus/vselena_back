import { DataSource } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { Permission } from '../../rbac/entities/permission.entity';
import { SYSTEM_PERMISSIONS } from './permissions.seed';
import { SYSTEM_ROLES } from './roles.seed';
import { seedSettings } from './settings.seed';
import * as bcrypt from 'bcrypt';

export async function seedDefaultData(dataSource: DataSource) {
  console.log('🌱 Seeding default data...');

  // 1. Создаем permissions
  console.log('Creating permissions...');
  const permissionRepo = dataSource.getRepository(Permission);
  for (const permData of SYSTEM_PERMISSIONS) {
    const existing = await permissionRepo.findOne({ where: { name: permData.name } });
    if (!existing) {
      const permission = permissionRepo.create(permData);
      await permissionRepo.save(permission);
    }
  }

  // 2. Создаем organization
  console.log('Creating organization...');
  const orgRepo = dataSource.getRepository(Organization);
  let organization = await orgRepo.findOne({ where: { name: 'Loginus' } });
  if (!organization) {
    organization = orgRepo.create({
      name: 'Loginus',
      settings: {},
    });
    organization = await orgRepo.save(organization);
  }

  // 3. Создаем team
  console.log('Creating team...');
  const teamRepo = dataSource.getRepository(Team);
  let team = await teamRepo.findOne({ where: { name: 'Поддержка' } });
  if (!team) {
    team = teamRepo.create({
      name: 'Поддержка',
      description: 'Команда поддержки клиентов',
      organizationId: organization.id,
    });
    team = await teamRepo.save(team);
  }

  // 4. Создаем roles
  console.log('Creating roles...');
  const roleRepo = dataSource.getRepository(Role);
  const createdRoles: Role[] = [];

  for (const roleData of SYSTEM_ROLES) {
    const existing = await roleRepo.findOne({ where: { name: roleData.name } });
    if (!existing) {
      const role = roleRepo.create({
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        isGlobal: roleData.isGlobal,
        organizationId: roleData.isGlobal ? organization.id : null,
        teamId: roleData.isGlobal ? null : team.id,
      });
      const savedRole = await roleRepo.save(role);

      // Назначаем permissions
      const permissionIds = await permissionRepo
        .createQueryBuilder('permission')
        .where('permission.name IN (:...names)', { names: roleData.permissions })
        .getMany();

      if (permissionIds.length > 0) {
        await roleRepo
          .createQueryBuilder()
          .relation(Role, 'permissions')
          .of(savedRole.id)
          .add(permissionIds.map(p => p.id));
      }

      createdRoles.push(savedRole);
    } else {
      createdRoles.push(existing);
    }
  }

  // 5. Создаем admin пользователя
  console.log('Creating admin user...');
  const userRepo = dataSource.getRepository(User);
  let adminUser = await userRepo.findOne({ where: { email: 'admin@loginus.ru' } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    adminUser = userRepo.create({
      email: 'admin@loginus.ru',
      passwordHash,
      firstName: 'Админ',
      lastName: 'Системы',
      isActive: true,
      emailVerified: true,
    });
    adminUser = await userRepo.save(adminUser);

    // Добавляем связи с организацией и командой
    await userRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(adminUser.id)
      .add(organization.id);

    await userRepo
      .createQueryBuilder()
      .relation(User, 'teams')
      .of(adminUser.id)
      .add(team.id);

    // Назначаем super_admin роль через UserRoleAssignment
    const superAdminRole = createdRoles.find(r => r.name === 'super_admin');
    if (superAdminRole) {
      const userRoleAssignmentRepo = dataSource.getRepository('UserRoleAssignment');
      await userRoleAssignmentRepo.save({
        userId: adminUser.id,
        roleId: superAdminRole.id,
        organizationId: organization.id,
        teamId: team.id,
        assignedBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // 6. Создаем настройки системы (временно отключено)
  // await seedSettings(dataSource);

  console.log('✅ Default data seeded successfully!');
  console.log(`📧 Admin user: admin@loginus.ru / admin123`);
  console.log(`🏢 Organization: ${organization.name}`);
  console.log(`👥 Team: ${team.name}`);
  console.log(`🔑 Roles created: ${createdRoles.length}`);
  console.log(`🔐 Permissions created: ${SYSTEM_PERMISSIONS.length}`);
}
