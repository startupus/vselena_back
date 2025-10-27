// Интерфейсы для Multi-Auth системы

export interface MergeConflicts {
  // Конфликты в данных пользователя
  firstName?: {
    primary: string;
    secondary: string;
  };
  lastName?: {
    primary: string;
    secondary: string;
  };
  email?: {
    primary: string;
    secondary: string;
  };
  phone?: {
    primary: string;
    secondary: string;
  };
  avatarUrl?: {
    primary: string;
    secondary: string;
  };
  
  // Конфликты в ролях и членстве
  organizations?: {
    primary: string[];
    secondary: string[];
  };
  teams?: {
    primary: string[];
    secondary: string[];
  };
  roles?: {
    primary: string[];
    secondary: string[];
  };
  
  // Конфликты в настройках
  preferences?: {
    primary: any;
    secondary: any;
  };
}

export interface MergeResolution {
  // Разрешение конфликтов данных
  firstName?: 'primary' | 'secondary' | 'manual';
  lastName?: 'primary' | 'secondary' | 'manual';
  email?: 'primary' | 'secondary' | 'manual';
  phone?: 'primary' | 'secondary' | 'manual';
  avatarUrl?: 'primary' | 'secondary' | 'manual';
  
  // Разрешение конфликтов ролей и членства
  organizations?: 'primary' | 'secondary' | 'merge';
  teams?: 'primary' | 'secondary' | 'merge';
  roles?: 'primary' | 'secondary' | 'merge';
  
  // Разрешение конфликтов настроек
  preferences?: 'primary' | 'secondary' | 'merge';
  
  // Ручные значения (если выбрано 'manual')
  manualValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
}

export interface AuthMethodConfig {
  enabled: boolean;
  requireVerification: boolean;
  clientId?: string;
  clientSecret?: string;
  appId?: string;
  appSecret?: string;
  webhookUrl?: string;
  redirectUrl?: string;
}

export interface SystemAuthSettings {
  EMAIL: AuthMethodConfig;
  PHONE_WHATSAPP: AuthMethodConfig;
  PHONE_TELEGRAM: AuthMethodConfig;
  GOSUSLUGI: AuthMethodConfig;
  VKONTAKTE: AuthMethodConfig;
  GITHUB: AuthMethodConfig;
}

export interface MessengerPreferences {
  whatsapp: {
    enabled: boolean;
    phoneNumber?: string;
    verified: boolean;
  };
  telegram: {
    enabled: boolean;
    username?: string;
    chatId?: string;
    verified: boolean;
  };
}

export interface MfaSettings {
  enabled: boolean;
  methods: string[]; // ['EMAIL', 'PHONE_WHATSAPP', 'PHONE_TELEGRAM', 'GOSUSLUGI', 'VKONTAKTE', 'GITHUB']
  backupCodes: string[];
  backupCodesUsed: string[];
  requiredMethods: number; // Минимальное количество методов для входа
}

export interface OAuthMetadata {
  provider: string;
  providerId: string;
  username?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
}

export interface MessengerMetadata {
  whatsapp?: {
    phoneNumber: string;
    businessAccountId?: string;
    lastMessageId?: string;
  };
  telegram?: {
    username: string;
    chatId: string;
    botToken?: string;
    lastMessageId?: string;
  };
}

export interface VerificationCodeData {
  code: string;
  identifier: string;
  authMethod: string;
  purpose: string;
  expiresAt: Date;
  metadata?: any;
}

export interface AccountMergeRequestData {
  primaryUserId: string;
  secondaryUserId: string;
  authMethod: string;
  conflicts: MergeConflicts;
  resolution?: MergeResolution;
  status: 'pending' | 'resolved' | 'rejected' | 'expired';
  expiresAt?: Date;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
  verificationCode?: string;
  requiresMerge?: boolean;
  mergeRequestId?: string;
  conflicts?: MergeConflicts;
  error?: string;
}

export interface PhoneVerificationResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  requiresMerge?: boolean;
  mergeRequestId?: string;
  conflicts?: MergeConflicts;
  alreadyLinked?: boolean;
  error?: string;
}