import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMultiAuthFields1761341000000 implements MigrationInterface {
  name = 'AddMultiAuthFields1761341000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем существование колонок перед добавлением
    const phoneExists = await queryRunner.hasColumn('users', 'phone');
    const githubIdExists = await queryRunner.hasColumn('users', 'githubId');
    const githubUsernameExists = await queryRunner.hasColumn('users', 'githubUsername');
    const gosuslugiIdExists = await queryRunner.hasColumn('users', 'gosuslugiId');
    const vkontakteIdExists = await queryRunner.hasColumn('users', 'vkontakteId');
    const primaryAuthMethodExists = await queryRunner.hasColumn('users', 'primaryAuthMethod');
    const availableAuthMethodsExists = await queryRunner.hasColumn('users', 'availableAuthMethods');
    const mfaSettingsExists = await queryRunner.hasColumn('users', 'mfaSettings');
    const phoneVerifiedExists = await queryRunner.hasColumn('users', 'phoneVerified');
    const githubVerifiedExists = await queryRunner.hasColumn('users', 'githubVerified');
    const gosuslugiVerifiedExists = await queryRunner.hasColumn('users', 'gosuslugiVerified');
    const vkontakteVerifiedExists = await queryRunner.hasColumn('users', 'vkontakteVerified');
    const messengerPreferencesExists = await queryRunner.hasColumn('users', 'messengerPreferences');
    const oauthMetadataExists = await queryRunner.hasColumn('users', 'oauthMetadata');
    const messengerMetadataExists = await queryRunner.hasColumn('users', 'messengerMetadata');

    // Добавляем новые колонки только если они не существуют
    if (!phoneExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '20',
        isNullable: true
      }));
    }

    if (!githubIdExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'githubId',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    if (!githubUsernameExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'githubUsername',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    if (!gosuslugiIdExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'gosuslugiId',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    if (!vkontakteIdExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'vkontakteId',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    if (!primaryAuthMethodExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'primaryAuthMethod',
        type: 'varchar',
        length: '50',
        default: "'EMAIL'"
      }));
    }

    if (!availableAuthMethodsExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'availableAuthMethods',
        type: 'jsonb',
        default: "'[\"EMAIL\"]'"
      }));
    }

    if (!mfaSettingsExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'mfaSettings',
        type: 'jsonb',
        isNullable: true
      }));
    }

    if (!phoneVerifiedExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'phoneVerified',
        type: 'boolean',
        default: false
      }));
    }

    if (!githubVerifiedExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'githubVerified',
        type: 'boolean',
        default: false
      }));
    }

    if (!gosuslugiVerifiedExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'gosuslugiVerified',
        type: 'boolean',
        default: false
      }));
    }

    if (!vkontakteVerifiedExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'vkontakteVerified',
        type: 'boolean',
        default: false
      }));
    }

    if (!messengerPreferencesExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'messengerPreferences',
        type: 'jsonb',
        isNullable: true
      }));
    }

    if (!oauthMetadataExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'oauthMetadata',
        type: 'jsonb',
        isNullable: true
      }));
    }

    if (!messengerMetadataExists) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'messengerMetadata',
        type: 'jsonb',
        isNullable: true
      }));
    }

    // Делаем email nullable для OAuth пользователей
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN email DROP NOT NULL
    `);

    // Обновляем существующих пользователей
    await queryRunner.query(`
      UPDATE users 
      SET 
        "primaryAuthMethod" = 'EMAIL',
        "availableAuthMethods" = '["EMAIL"]',
        "phoneVerified" = false,
        "githubVerified" = false,
        "gosuslugiVerified" = false,
        "vkontakteVerified" = false
      WHERE "primaryAuthMethod" IS NULL
    `);

    // Добавляем настройки аутентификации в системные настройки
    await queryRunner.query(`
      INSERT INTO system_settings (key, value) VALUES 
      ('auth_methods', '{
        "EMAIL": {"enabled": true, "requireVerification": true},
        "PHONE_WHATSAPP": {"enabled": false, "requireVerification": true},
        "PHONE_TELEGRAM": {"enabled": false, "requireVerification": true},
        "GOSUSLUGI": {"enabled": false, "clientId": "", "clientSecret": ""},
        "VKONTAKTE": {"enabled": false, "appId": "", "appSecret": ""},
        "GITHUB": {"enabled": false, "clientId": "", "clientSecret": ""}
      }')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные колонки
    await queryRunner.dropColumn('users', 'messengerMetadata');
    await queryRunner.dropColumn('users', 'oauthMetadata');
    await queryRunner.dropColumn('users', 'messengerPreferences');
    await queryRunner.dropColumn('users', 'vkontakteVerified');
    await queryRunner.dropColumn('users', 'gosuslugiVerified');
    await queryRunner.dropColumn('users', 'githubVerified');
    await queryRunner.dropColumn('users', 'phoneVerified');
    await queryRunner.dropColumn('users', 'mfaSettings');
    await queryRunner.dropColumn('users', 'availableAuthMethods');
    await queryRunner.dropColumn('users', 'primaryAuthMethod');
    await queryRunner.dropColumn('users', 'vkontakteId');
    await queryRunner.dropColumn('users', 'gosuslugiId');
    await queryRunner.dropColumn('users', 'githubUsername');
    await queryRunner.dropColumn('users', 'githubId');
    await queryRunner.dropColumn('users', 'phone');

    // Возвращаем email как NOT NULL
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN email SET NOT NULL
    `);

    // Удаляем настройки аутентификации
    await queryRunner.query(`
      DELETE FROM system_settings WHERE key = 'auth_methods'
    `);
  }
}
