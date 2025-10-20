export interface SimpleMicroModule {
  name: string;
  version: string;
  description: string;
  type: '2fa' | 'role-promotion' | 'social-auth';
  enabled: boolean;
  priority: number;
}

export interface MicroModuleService {
  getModuleInfo(): SimpleMicroModule;
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
}
