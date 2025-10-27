export enum AuthMethodType {
  EMAIL = 'EMAIL',
  PHONE_WHATSAPP = 'PHONE_WHATSAPP',
  PHONE_TELEGRAM = 'PHONE_TELEGRAM',
  GOSUSLUGI = 'GOSUSLUGI',
  VKONTAKTE = 'VKONTAKTE',
  GITHUB = 'GITHUB',
}

export type MessengerType = 'whatsapp' | 'telegram';
export type PhoneAuthMethod = AuthMethodType.PHONE_WHATSAPP | AuthMethodType.PHONE_TELEGRAM;
export type OAuthMethod = AuthMethodType.GOSUSLUGI | AuthMethodType.VKONTAKTE | AuthMethodType.GITHUB;
