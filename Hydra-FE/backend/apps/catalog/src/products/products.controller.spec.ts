import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

const mockProductsService = {
  findByIds: jest.fn(),
  create: jest.fn(),
  createBundle: jest.fn(),
  createBulk: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  searchImportation: jest.fn(),
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByIds — batch endpoint validation (#11)', () => {
    it('should throw BadRequestException when ids is not an array', async () => {
      await expect(controller.findByIds({ ids: 'not-an-array' as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when ids has more than 50 items', async () => {
      const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`);
      await expect(controller.findByIds({ ids })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when ids has exactly 51 items', async () => {
      const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`);
      await expect(controller.findByIds({ ids })).rejects.toThrow(
        'ids must be an array with at most 50 items',
      );
    });

    it('should pass when ids has exactly 50 items (non-UUID get filtered)', async () => {
      const ids = Array.from({ length: 50 }, (_, i) => `id-${i}`);
      mockProductsService.findByIds.mockResolvedValue([]);
      const result = await controller.findByIds({ ids });
      expect(mockProductsService.findByIds).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should pass when ids is an empty array', async () => {
      mockProductsService.findByIds.mockResolvedValue([]);
      const result = await controller.findByIds({ ids: [] });
      expect(result).toEqual([]);
    });

    it('should pass when ids has 1 valid UUID item', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      mockProductsService.findByIds.mockResolvedValue([{ id: uuid }]);
      const result = await controller.findByIds({ ids: [uuid] });
      expect(mockProductsService.findByIds).toHaveBeenCalledWith([uuid]);
      expect(result).toEqual([{ id: uuid }]);
    });
  });
});
