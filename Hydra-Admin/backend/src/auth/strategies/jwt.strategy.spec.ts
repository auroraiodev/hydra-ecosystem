import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';

// Minimal mock for ConfigService
const makeConfig = (secret: string | undefined) => ({
  get: jest.fn().mockReturnValue(secret),
});

// Minimal mock for UsersService
const makeUsersService = (user: any) => ({
  findById: jest.fn().mockResolvedValue(user),
});

describe('JwtStrategy', () => {
  describe('constructor', () => {
    it('should throw if JWT_SECRET is missing', () => {
      expect(() => {
        new JwtStrategy(makeConfig(undefined) as any, makeUsersService(null) as any);
      }).toThrow('JWT_SECRET environment variable is required and must not be empty');
    });

    it('should throw if JWT_SECRET is an empty string', () => {
      expect(() => {
        new JwtStrategy(makeConfig('') as any, makeUsersService(null) as any);
      }).toThrow('JWT_SECRET environment variable is required and must not be empty');
    });

    it('should not throw when JWT_SECRET is provided', () => {
      expect(() => {
        new JwtStrategy(makeConfig('supersecret') as any, makeUsersService(null) as any);
      }).not.toThrow();
    });
  });

  describe('validate', () => {
    let strategy: JwtStrategy;
    const activeUser = { id: 'user-1', is_active: true, role: { name: 'CLIENT' } };
    const inactiveUser = { id: 'user-2', is_active: false, role: { name: 'CLIENT' } };

    beforeEach(() => {
      strategy = new JwtStrategy(
        makeConfig('supersecret') as any,
        makeUsersService(activeUser) as any,
      );
    });

    it('should return user when valid payload and active user', async () => {
      const result = await strategy.validate({ sub: 'user-1', email: 'a@b.com' } as any);
      expect(result).toBe(activeUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const usersService = makeUsersService(null);
      strategy = new JwtStrategy(makeConfig('supersecret') as any, usersService as any);
      await expect(strategy.validate({ sub: 'ghost', email: 'x@y.com' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const usersService = makeUsersService(inactiveUser);
      strategy = new JwtStrategy(makeConfig('supersecret') as any, usersService as any);
      await expect(strategy.validate({ sub: 'user-2', email: 'x@y.com' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
