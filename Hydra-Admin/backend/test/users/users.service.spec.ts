import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { NotFoundError, ConflictError } from '../../src/common/interfaces/api-response.interface';
import { HibpService } from '../../src/common/hibp/hibp.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed-password',
    first_name: 'Test',
    last_name: 'User',
    role_id: 'role-123',
    is_active: true,
    avatar_url: null,
    phone: null,
    balance: new Prisma.Decimal(0),
    is_email_verified: false,
    verification_token: null,
    reset_token: null,
    locked_until: null,
    email_verified: false,
    has_seen_modal: false,
    failed_login_attempts: 0,
    store_name: null,
    rfc: null,
    store_logo_url: null,
    is_hydra_alias: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRole = {
    id: 'role-123',
    name: 'CLIENT',
    display_name: 'Client',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      users: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      roles: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        { provide: HibpService, useValue: { assertNotPwned: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      password: 'password123',
      role_id: 'role-123',
    };

    it('should create a user successfully', async () => {
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null); // Username check

      jest.spyOn(prismaService.roles, 'findUnique').mockResolvedValue(mockRole as any);

      jest.spyOn(prismaService.users, 'create').mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).not.toHaveProperty('password');
      expect(prismaService.users.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          password: expect.any(String),
          role_id: 'role-123',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
        },
        include: {
          roles: true,
        },
      });
    });

    it('should throw error if email already exists', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValueOnce(mockUser); // Email check

      await expect(service.create(createUserDto)).rejects.toThrow();
    });

    it('should throw error if role does not exist', async () => {
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null); // Username check

      jest.spyOn(prismaService.roles, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue({ ...mockUser, roles: mockRole } as any);

      const result = await service.findById('user-123');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { roles: true },
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(null);

      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue({ ...mockUser, roles: mockRole } as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { roles: true },
      });
    });

    it('should return null if user not found by email', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(mockUser);

      jest.spyOn(prismaService.users, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateUserDto);

      expect(result).not.toHaveProperty('password');
      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          ...(updateUserDto.email && { email: updateUserDto.email }),
          ...(updateUserDto.username && { username: updateUserDto.username }),
          ...(updateUserDto.role_id && { role_id: updateUserDto.role_id }),
          ...(updateUserDto.first_name !== undefined && { first_name: updateUserDto.first_name }),
          ...(updateUserDto.last_name !== undefined && { last_name: updateUserDto.last_name }),
          ...(updateUserDto.is_active !== undefined && { is_active: updateUserDto.is_active }),
        },
        include: { roles: true },
      });
    });

    it('should throw exception if user to update not found', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(mockUser);

      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(mockUser);
      const txMock = {
        wallet_transactions: { deleteMany: jest.fn() },
        carts: { findUnique: jest.fn().mockResolvedValue(null), delete: jest.fn() },
        cart_items: { deleteMany: jest.fn() },
        orders: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
        payments: { deleteMany: jest.fn() },
        order_shipping: { deleteMany: jest.fn() },
        order_items_importation: { deleteMany: jest.fn() },
        order_items: { deleteMany: jest.fn() },
        listings: { deleteMany: jest.fn() },
        singles: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
        single_tags: { deleteMany: jest.fn() },
        user_addresses: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
        users: { delete: jest.fn() },
      };
      (prismaService as any).$transaction.mockImplementation(async (fn: any) => fn(txMock));

      const result = await service.remove('user-123');

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw exception if user to delete not found', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];

      jest.spyOn(prismaService.users, 'findMany').mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
    });

    it('should handle search filters', async () => {
      const users = [mockUser];

      jest.spyOn(prismaService.users, 'findMany').mockResolvedValue(users);

      await service.findAll('test');

      expect(prismaService.users.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { username: { contains: 'test', mode: 'insensitive' } },
            { first_name: { contains: 'test', mode: 'insensitive' } },
            { last_name: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        include: { roles: true },
      });
    });
  });
});
