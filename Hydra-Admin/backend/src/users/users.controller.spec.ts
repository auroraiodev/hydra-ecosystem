import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  create: jest.fn(),
  signup: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  getAddresses: jest.fn(),
  addAddress: jest.fn(),
  deleteAddress: jest.fn(),
  findById: jest.fn(),
};

const mockActor = {
  id: 'admin-uuid',
  email: 'admin@test.com',
  role: { name: 'ADMIN' },
  is_active: true,
};

describe('UsersController', () => {
  let controller: UsersController;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    // Spy on the logger's warn method via the private property
    loggerWarnSpy = jest.spyOn((controller as any).logger, 'warn').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call usersService.findAll without logging to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockUsersService.findAll.mockResolvedValue([]);

      await controller.findAll('test');

      expect(mockUsersService.findAll).toHaveBeenCalledWith('test', false, false);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('update — audit logging (#19)', () => {
    it('should emit an [AUDIT] warn log when updating a user', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'user-1' });

      await controller.update('user-1', { email: 'new@test.com' }, mockActor as any);

      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('admin-uuid'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('user-1'));
    });
  });

  describe('remove — audit logging (#19)', () => {
    it('should emit an [AUDIT] warn log when deleting a user', async () => {
      mockUsersService.remove.mockResolvedValue({ message: 'deleted' });

      await controller.remove('user-2', mockActor as any);

      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('admin-uuid'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('user-2'));
    });
  });

  describe('resetPassword — audit logging (#19)', () => {
    it('should emit an [AUDIT] warn log when resetting a password', async () => {
      mockUsersService.resetPassword.mockResolvedValue({ message: 'reset' });

      await controller.resetPassword('user-3', { newPassword: 'newPass123' }, mockActor as any);

      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('admin-uuid'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('user-3'));
    });
  });
});
