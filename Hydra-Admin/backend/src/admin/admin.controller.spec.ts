import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminAnalyticsController } from './admin-analytics.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminWalletController } from './admin-wallet.controller.js';
import { AdminSettingsController } from './admin-settings.controller.js';
import { AdminToolsController } from './admin-tools.controller.js';
import { AdminService } from './admin.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AdminControllers', () => {
  const mockAdminService = {};

  const notificationProviders: any[] = [
    { provide: NotificationsService, useValue: { sendNotification: jest.fn() } },
  ];

  async function compileController(Controller: any) {
    const allProviders = [
      { provide: AdminService, useValue: mockAdminService },
      ...(Controller === AdminToolsController ? notificationProviders : []),
    ];
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Controller],
      providers: allProviders,
    }).compile();
    return module.get(Controller);
  }

  it('AdminDashboardController should be defined', async () => {
    expect(await compileController(AdminDashboardController)).toBeDefined();
  });

  it('AdminAnalyticsController should be defined', async () => {
    expect(await compileController(AdminAnalyticsController)).toBeDefined();
  });

  it('AdminOrdersController should be defined', async () => {
    expect(await compileController(AdminOrdersController)).toBeDefined();
  });

  it('AdminWalletController should be defined', async () => {
    expect(await compileController(AdminWalletController)).toBeDefined();
  });

  it('AdminSettingsController should be defined', async () => {
    expect(await compileController(AdminSettingsController)).toBeDefined();
  });

  it('AdminToolsController should be defined', async () => {
    expect(await compileController(AdminToolsController)).toBeDefined();
  });
});
