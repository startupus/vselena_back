import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepo: Repository<SystemSetting>,
  ) {}

  /**
   * Получить значение настройки
   */
  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepo.findOne({
      where: { key }
    });
    return setting?.value || null;
  }

  /**
   * Установить значение настройки
   */
  async setSetting(key: string, value: string, description?: string): Promise<void> {
    await this.settingsRepo.upsert(
      { key, value, description },
      ['key']
    );
  }

  /**
   * Получить роль по умолчанию для новых пользователей
   */
  async getDefaultUserRole(): Promise<string> {
    const role = await this.getSetting('default_user_role');
    return role || 'viewer'; // По умолчанию viewer
  }

  /**
   * Установить роль по умолчанию для новых пользователей
   */
  async setDefaultUserRole(roleName: string): Promise<void> {
    await this.setSetting(
      'default_user_role', 
      roleName, 
      'Роль по умолчанию для новых пользователей'
    );
  }

  /**
   * Получить все настройки
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    return this.settingsRepo.find({
      order: { key: 'ASC' }
    });
  }
}