export enum TwoFactorMethod {
  EMAIL = 'email',
  SMS = 'sms',
  TOTP = 'totp', // Google Authenticator, Authy
  BACKUP_CODE = 'backup_code',
}

export enum TwoFactorStatus {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  PENDING_SETUP = 'pending_setup',
}

export interface TwoFactorSettings {
  enabled: boolean;
  methods: TwoFactorMethod[];
  emailVerified: boolean;
  phoneVerified: boolean;
  totpSecret?: string;
  backupCodes?: string[];
  usedBackupCodes: string[];
}
