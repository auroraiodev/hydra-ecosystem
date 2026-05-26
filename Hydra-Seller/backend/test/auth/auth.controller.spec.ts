import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { AdminLoginDto } from '../../src/auth/dto/admin-login.dto';

import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    avatar_url: null,
    phone: null,
    role: {
      id: 'role-123',
      name: 'CLIENT',
      display_name: 'Client',
    },
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser,
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      adminLogin: jest.fn(),
      refresh: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully and set cookie', async () => {
      jest.spyOn(authService, 'login').mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto, mockRes as any);

      expect(result).toEqual(mockTokens);
      expect(mockRes.cookie).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('adminLogin', () => {
    const adminLoginDto: AdminLoginDto = {
      email: 'admin@example.com',
      password: 'adminpassword',
    };

    it('should login admin successfully and set cookie', async () => {
      jest.spyOn(authService, 'adminLogin').mockResolvedValue(mockTokens);

      const result = await controller.adminLogin(adminLoginDto, mockRes as any);

      expect(result).toEqual({
        user: mockTokens.user,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      jest.spyOn(authService, 'refresh').mockResolvedValue(mockTokens);

      const result = await controller.refresh('old-refresh-token');

      expect(result).toEqual(mockTokens);
      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
    });
  });
});
