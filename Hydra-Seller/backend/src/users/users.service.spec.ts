import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { HibpService } from '../common/hibp/hibp.service';

const baseUser = {
  id: 'user-uuid',
  email: 'test@test.com',
  username: 'testuser',
  password: 'hashed',
  first_name: 'John',
  last_name: 'Doe',
  phone: null,
  is_active: true,
  role_id: 'role-uuid',
  avatar_url: null,
  roles: { id: 'role-uuid', name: 'CLIENT', display_name: 'Client' },
};

const mockPrisma = {
  users: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  roles: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  user_addresses: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HibpService, useValue: { assertNotPwned: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll — #20 no console.log', () => {
    it('should not call console.log', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockPrisma.users.findMany.mockResolvedValue([]);
      await service.findAll('pikachu');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should exclude password from results', async () => {
      mockPrisma.users.findMany.mockResolvedValue([baseUser]);
      const result = await service.findAll();
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).toHaveProperty('email', 'test@test.com');
    });

    it('should pass search term to Prisma where clause', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      await service.findAll('john');
      const callArg = mockPrisma.users.findMany.mock.calls[0][0];
      expect(callArg.where.OR).toBeDefined();
      expect(callArg.where.OR.some((c: any) => c.first_name)).toBeTruthy();
    });
  });

  describe('findOne', () => {
    it('should exclude password from result', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(baseUser);
      const result = await service.findOne('user-uuid');
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', 'test@test.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should exclude password from response', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.roles.findUnique.mockResolvedValue({ id: 'role-uuid', name: 'CLIENT' });
      mockPrisma.users.create.mockResolvedValue(baseUser);

      const result = await service.create({
        email: 'new@test.com',
        username: 'newuser',
        password: 'Pass123',
        role_id: 'role-uuid',
      } as any);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('should exclude password from response', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(baseUser);
      mockPrisma.users.update.mockResolvedValue({ ...baseUser, first_name: 'Jane' });

      const result = await service.update('user-uuid', { first_name: 'Jane' });

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('first_name', 'Jane');
    });
  });

  describe('resetPassword', () => {
    it('should exclude password from the returned user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(baseUser);
      mockPrisma.users.update.mockResolvedValue(baseUser);

      const result = await service.resetPassword('user-uuid', { newPassword: 'NewPass1!' });

      expect(result.user).not.toHaveProperty('password');
      expect(result.message).toContain('Password has been reset');
    });
  });
});
