import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MicroModuleRegistryService } from '../src/common/services/micro-module-registry.service';

describe('MicroModules (e2e)', () => {
  let app: INestApplication;
  let registryService: MicroModuleRegistryService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    registryService = app.get<MicroModuleRegistryService>(MicroModuleRegistryService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/micro-modules (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/micro-modules')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('/micro-modules/enabled (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/micro-modules/enabled')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.every((module: any) => module.isEnabled)).toBe(true);
      });
  });

  it('/micro-modules/stats (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/micro-modules/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('enabled');
        expect(res.body).toHaveProperty('disabled');
        expect(res.body).toHaveProperty('system');
        expect(res.body).toHaveProperty('custom');
      });
  });

  it('should register email auth module', () => {
    const emailAuthModule = registryService.getModule('email-auth');
    expect(emailAuthModule).toBeDefined();
    expect(emailAuthModule?.name).toBe('email-auth');
    expect(emailAuthModule?.isEnabled).toBe(true);
    expect(emailAuthModule?.isSystem).toBe(true);
  });

  it('should register phone auth module', () => {
    const phoneAuthModule = registryService.getModule('phone-auth');
    expect(phoneAuthModule).toBeDefined();
    expect(phoneAuthModule?.name).toBe('phone-auth');
    expect(phoneAuthModule?.isEnabled).toBe(false);
    expect(phoneAuthModule?.isSystem).toBe(false);
  });

  it('should register referral system module', () => {
    const referralModule = registryService.getModule('referral-system');
    expect(referralModule).toBeDefined();
    expect(referralModule?.name).toBe('referral-system');
    expect(referralModule?.isEnabled).toBe(true);
    expect(referralModule?.isSystem).toBe(false);
  });

  it('should register custom roles module', () => {
    const customRolesModule = registryService.getModule('custom-roles');
    expect(customRolesModule).toBeDefined();
    expect(customRolesModule?.name).toBe('custom-roles');
    expect(customRolesModule?.isEnabled).toBe(true);
    expect(customRolesModule?.isSystem).toBe(false);
  });

  it('should register UI permissions module', () => {
    const uiPermissionsModule = registryService.getModule('ui-permissions');
    expect(uiPermissionsModule).toBeDefined();
    expect(uiPermissionsModule?.name).toBe('ui-permissions');
    expect(uiPermissionsModule?.isEnabled).toBe(true);
    expect(uiPermissionsModule?.isSystem).toBe(true);
  });

  it('should get module statistics', () => {
    const stats = registryService.getModuleStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.enabled).toBeGreaterThan(0);
    expect(stats.system).toBeGreaterThan(0);
  });

  it('should get all UI elements', () => {
    const uiElements = registryService.getAllUIElements();
    expect(uiElements).toBeInstanceOf(Array);
    expect(uiElements.length).toBeGreaterThan(0);
  });
});
