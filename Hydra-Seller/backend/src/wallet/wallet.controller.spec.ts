import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto.js';

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: jest.Mocked<WalletService>;

  const mockUser: UserWithRole = {
    id: 'user1',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    is_hydra_alias: false,
    role: { id: 'role1', name: 'CLIENT', display_name: 'Client' },
  };

  beforeEach(async () => {
    const mockWalletService = {
      getWalletData: jest.fn(),
      requestWithdrawal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: mockWalletService }],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get(WalletService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return wallet data for user', async () => {
      const mockWalletData = { balance: 1000, transactions: [] };

      walletService.getWalletData.mockResolvedValue(mockWalletData);

      const result = await controller.getWallet(mockUser);

      expect(walletService.getWalletData).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(mockWalletData);
    });
  });

  describe('requestWithdrawal', () => {
    it('should process withdrawal request', async () => {
      const withdrawalBody: WithdrawalRequestDto = { amount: 200, details: 'Test withdrawal' };
      const expectedResult = { id: 'withdrawal1', success: true };

      walletService.requestWithdrawal.mockResolvedValue(expectedResult as any);

      const result = await controller.requestWithdrawal(mockUser, withdrawalBody);

      expect(walletService.requestWithdrawal).toHaveBeenCalledWith(
        mockUser.id,
        withdrawalBody.amount,
        withdrawalBody.details,
      );
      expect(result).toBe(expectedResult);
    });
  });
});
