import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@hydra/database';
import { CacheService } from '@hydra/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrismaService = {
      categories: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      singles: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn(), invalidatePattern: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
    // Mock singles count for findAll so _count doesn't fail
    prisma.singles.count.mockResolvedValue(0);
    // Mock findMany for fallback patterns
    prisma.categories.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto = {
        name: 'TEST',
        display_name: 'Test Category',
        order: 2,
      };
      const mockCategory = { id: '1', ...createCategoryDto, tcgs: [], tcgs_categories_tcgs: [] };

      prisma.categories.findUnique.mockResolvedValue(null);
      prisma.categories.create.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(prisma.categories.findUnique).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(prisma.categories.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [{ id: '1', name: 'TEST' }];

      prisma.categories.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(prisma.categories.findMany).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findActive', () => {
    it('should return active categories', async () => {
      const mockCategories = [
        { id: '1', name: 'TEST', is_active: true, tcgs: [], tcgs_categories_tcgs: [] },
      ];

      prisma.categories.findMany.mockResolvedValue(mockCategories);

      const result = await service.findActive();

      expect(prisma.categories.findMany).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findWithProducts', () => {
    it('should return categories with active products', async () => {
      prisma.categories.findMany.mockResolvedValue([]);

      const result = await service.findWithProducts();

      expect(prisma.categories.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const id = '1';
      const mockCategory = { id: '1', name: 'TEST', tcgs: [], tcgs_categories_tcgs: [] };
      const singlesCount = 5;

      prisma.categories.findUnique.mockResolvedValue(mockCategory);
      prisma.singles.count.mockResolvedValue(singlesCount);

      const result = await service.findOne(id);

      expect(prisma.categories.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object),
      });
      expect(prisma.singles.count).toHaveBeenCalledWith({
        where: { category_id: id },
      });
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const id = '1';
      const updateCategoryDto = { display_name: 'Updated Category' };
      const mockCategory = { id: '1', ...updateCategoryDto, tcgs: [], tcgs_categories_tcgs: [] };

      prisma.categories.findUnique.mockResolvedValue({ id: '1', name: 'TEST' });
      prisma.categories.update.mockResolvedValue(mockCategory);

      const result = await service.update(id, updateCategoryDto);

      expect(prisma.categories.update).toHaveBeenCalledWith({
        where: { id },
        data: updateCategoryDto,
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const id = '1';
      const mockCategory = { id: '1', name: 'TEST' };

      prisma.categories.findUnique.mockResolvedValue(mockCategory);
      prisma.singles.count.mockResolvedValue(0);
      prisma.categories.delete.mockResolvedValue(mockCategory);

      const result = await service.remove(id);

      expect(prisma.categories.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBe(mockCategory);
    });
  });

  describe('toggleActive', () => {
    it('should toggle category active status', async () => {
      const id = '1';
      const mockCategory = { id: '1', name: 'TEST', is_active: false };

      prisma.categories.findUnique.mockResolvedValue({
        id: '1',
        name: 'TEST',
        is_active: true,
      });
      prisma.categories.update.mockResolvedValue(mockCategory);

      const result = await service.toggleActive(id);

      expect(prisma.categories.update).toHaveBeenCalledWith({
        where: { id },
        data: { is_active: false },
      });
      expect(result).toBe(mockCategory);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple categories', async () => {
      const createCategoriesDto = [
        { name: 'TEST1', display_name: 'Test 1', order: 1 },
        { name: 'TEST2', display_name: 'Test 2', order: 2 },
      ];
      const mockCategories = [{ id: '1', name: 'TEST1' }];

      prisma.$transaction.mockResolvedValue(mockCategories);

      const result = await service.bulkCreate(createCategoriesDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(mockCategories);
    });
  });

  describe('reorder', () => {
    it('should reorder categories', async () => {
      const items = [
        { id: '1', order: 1 },
        { id: '2', order: 2 },
      ];
      const mockCategories = [{ id: '1', order: 1 }];

      prisma.$transaction.mockResolvedValue(mockCategories);

      const result = await service.reorder(items);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(mockCategories);
    });
  });
});
