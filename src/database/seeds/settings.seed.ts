import { DataSource } from 'typeorm';
import { SystemSettings } from '../../settings/entities/system-settings.entity';
import { FeatureSettings } from '../../settings/entities/feature-settings.entity';
import { RoleHierarchy } from '../../settings/entities/role-hierarchy.entity';
import { Role } from '../../rbac/entities/role.entity';

export async function seedSettings(dataSource: DataSource) {
  console.log('🌱 Seeding settings...');

  const systemSettingsRepo = dataSource.getRepository(SystemSettings);
  const featureSettingsRepo = dataSource.getRepository(FeatureSettings);
  const roleHierarchyRepo = dataSource.getRepository(RoleHierarchy);
  const rolesRepo = dataSource.getRepository(Role);

  // 1. Создаем системные настройки
  console.log('Creating system settings...');
  const systemSettings = [
    {
      key: 'default_user_role',
      value: 'viewer',
      description: 'Роль по умолчанию для новых пользователей',
      type: 'string',
      isSystem: true,
      isEditable: true,
    },
    {
      key: 'referral_system_enabled',
      value: 'true',
      description: 'Включена ли реферальная система',
      type: 'boolean',
      isSystem: false,
      isEditable: true,
    },
    {
      key: 'invitation_expiry_days',
      value: '7',
      description: 'Срок действия приглашений (дни)',
      type: 'number',
      isSystem: false,
      isEditable: true,
    },
    {
      key: 'max_team_members',
      value: '50',
      description: 'Максимальное количество участников в команде',
      type: 'number',
      isSystem: false,
      isEditable: true,
    },
    {
      key: 'email_verification_required',
      value: 'true',
      description: 'Требуется ли подтверждение email при регистрации',
      type: 'boolean',
      isSystem: false,
      isEditable: true,
    },
  ];

  for (const settingData of systemSettings) {
    const existing = await systemSettingsRepo.findOne({
      where: { key: settingData.key },
    });

    if (!existing) {
      const setting = systemSettingsRepo.create();
      setting.key = settingData.key;
      setting.value = settingData.value;
      setting.description = settingData.description;
      setting.type = settingData.type as 'string' | 'number' | 'boolean' | 'json' | 'array';
      setting.isSystem = settingData.isSystem;
      setting.isEditable = settingData.isEditable;
      await systemSettingsRepo.save(setting);
    }
  }

  // 2. Создаем настройки функций
  console.log('Creating feature settings...');
  const featureSettings = [
    {
      featureName: 'email-auth',
      displayName: 'Авторизация по email',
      description: 'Вход в систему по email и паролю',
      isEnabled: true,
      isSystem: true,
      type: 'micro-module',
      priority: 100,
    },
    {
      featureName: 'phone-auth',
      displayName: 'Авторизация по телефону',
      description: 'Вход в систему по номеру телефона',
      isEnabled: false,
      isSystem: false,
      type: 'micro-module',
      priority: 90,
    },
    {
      featureName: 'social-auth',
      displayName: 'Социальные сети',
      description: 'Вход через социальные сети (VK, Google, Yandex)',
      isEnabled: false,
      isSystem: false,
      type: 'micro-module',
      priority: 80,
    },
    {
      featureName: 'referral-system',
      displayName: 'Реферальная система',
      description: 'Система приглашений и рефералов',
      isEnabled: true,
      isSystem: false,
      type: 'micro-module',
      priority: 70,
    },
    {
      featureName: 'custom-roles',
      displayName: 'Кастомные роли',
      description: 'Создание пользовательских ролей',
      isEnabled: true,
      isSystem: false,
      type: 'micro-module',
      priority: 60,
    },
    {
      featureName: 'custom-permissions',
      displayName: 'Кастомные права',
      description: 'Создание пользовательских прав доступа',
      isEnabled: true,
      isSystem: false,
      type: 'micro-module',
      priority: 50,
    },
    {
      featureName: 'two-factor-auth',
      displayName: 'Двухфакторная аутентификация',
      description: '2FA через email, SMS, Telegram',
      isEnabled: true,
      isSystem: false,
      type: 'micro-module',
      priority: 40,
    },
    {
      featureName: 'invitation-system',
      displayName: 'Система приглашений',
      description: 'Приглашение пользователей в организации и команды',
      isEnabled: true,
      isSystem: false,
      type: 'micro-module',
      priority: 30,
    },
  ];

  for (const featureData of featureSettings) {
    const existing = await featureSettingsRepo.findOne({
      where: { featureName: featureData.featureName },
    });

    if (!existing) {
      const feature = featureSettingsRepo.create();
      feature.featureName = featureData.featureName;
      feature.displayName = featureData.displayName;
      feature.description = featureData.description;
      feature.isEnabled = featureData.isEnabled;
      feature.isSystem = featureData.isSystem;
      feature.type = featureData.type as 'micro-module' | 'feature' | 'integration';
      feature.priority = featureData.priority;
      await featureSettingsRepo.save(feature);
    }
  }

  // 3. Создаем иерархию ролей
  console.log('Creating role hierarchy...');
  const roles = await rolesRepo.find();
  const roleMap = new Map(roles.map(role => [role.name, role]));

  const hierarchyData = [
    {
      roleName: 'super_admin',
      parentRoleName: null,
      level: 3,
      canManageLower: true,
      canManageEqual: true,
      canManageHigher: false,
    },
    {
      roleName: 'admin',
      parentRoleName: 'super_admin',
      level: 2,
      canManageLower: true,
      canManageEqual: false,
      canManageHigher: false,
    },
    {
      roleName: 'viewer',
      parentRoleName: 'admin',
      level: 1,
      canManageLower: false,
      canManageEqual: false,
      canManageHigher: false,
    },
    {
      roleName: 'manager',
      parentRoleName: 'admin',
      level: 1,
      canManageLower: true,
      canManageEqual: false,
      canManageHigher: false,
    },
    {
      roleName: 'editor',
      parentRoleName: 'manager',
      level: 0,
      canManageLower: false,
      canManageEqual: false,
      canManageHigher: false,
    },
  ];

  for (const hierarchyItem of hierarchyData) {
    const role = roleMap.get(hierarchyItem.roleName);
    const parentRole = hierarchyItem.parentRoleName 
      ? roleMap.get(hierarchyItem.parentRoleName) 
      : null;

    if (role) {
      const existing = await roleHierarchyRepo.findOne({
        where: { roleId: role.id },
      });

      if (!existing) {
        const hierarchy = roleHierarchyRepo.create({
          roleId: role.id,
          parentRoleId: parentRole?.id,
          level: hierarchyItem.level,
          canManageLower: hierarchyItem.canManageLower,
          canManageEqual: hierarchyItem.canManageEqual,
          canManageHigher: hierarchyItem.canManageHigher,
        });

        await roleHierarchyRepo.save(hierarchy);
      }
    }
  }

  console.log('✅ Settings seeded successfully');
}
