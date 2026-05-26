import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CacheService } from '@hydra/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockCategory = {
    id: '1',
    name: 'SINGLES',
    display_name: 'Singles',
    order: 1,
    is_active: true,
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as any;

  beforeEach(async () => {
    const mockCategoriesService = {
      findAll: jest.fn(),
      findWithProducts: jest.fn(),
      findActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      toggleActive: jest.fn(),
      remove: jest.fn(),
      bulkCreate: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn(), invalidatePattern: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with pagination', async () => {
      const expectedResult = [mockCategory];

      categoriesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(1, 10, 'test', true);

      expect(categoriesService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'test',
        isActive: true,
        cacheKey: 'categories:page:1:limit:10:search:test:active:true',
      });
      expect(result).toBe(expectedResult);
    });

    it('should use default values when parameters not provided', async () => {
      const expectedResult = [mockCategory];

      categoriesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(categoriesService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        isActive: undefined,
        cacheKey: 'categories:page:1:limit:10:search:none:active:all',
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('findWithProducts', () => {
    it('should return categories with products', async () => {
      const expectedResult = [mockCategory];

      categoriesService.findWithProducts.mockResolvedValue(expectedResult);

      const result = await controller.findWithProducts();

      expect(categoriesService.findWithProducts).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findActive', () => {
    it('should return active categories', async () => {
      const expectedResult = [mockCategory];

      categoriesService.findActive.mockResolvedValue(expectedResult);

      const result = await controller.findActive();

      expect(categoriesService.findActive).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const id = '1';
      const expectedResult = mockCategory;

      categoriesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(categoriesService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'TEST',
        display_name: 'Test Category',
        order: 2,
      };

      categoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createCategoryDto);

      expect(categoriesService.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toBe(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const id = '1';
      const updateCategoryDto: UpdateCategoryDto = {
        display_name: 'Updated Category',
      };

      categoriesService.update.mockResolvedValue(mockCategory);

      const result = await controller.update(id, updateCategoryDto);

      expect(categoriesService.update).toHaveBeenCalledWith(id, updateCategoryDto);
      expect(result).toBe(mockCategory);
    });
  });

  describe('toggleActive', () => {
    it('should toggle category active status', async () => {
      const id = '1';

      categoriesService.toggleActive.mockResolvedValue(mockCategory);

      const result = await controller.toggleActive(id);

      expect(categoriesService.toggleActive).toHaveBeenCalledWith(id);
      expect(result).toBe(mockCategory);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const id = '1';

      categoriesService.remove.mockResolvedValue(mockCategory);

      const result = await controller.remove(id);

      expect(categoriesService.remove).toHaveBeenCalledWith(id);
      expect(result).toBe(mockCategory);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple categories', async () => {
      const createCategoriesDto: CreateCategoryDto[] = [
        { name: 'TEST1', display_name: 'Test 1', order: 1 },
        { name: 'TEST2', display_name: 'Test 2', order: 2 },
      ];

      categoriesService.bulkCreate.mockResolvedValue([mockCategory]);

      const result = await controller.bulkCreate(createCategoriesDto);

      expect(categoriesService.bulkCreate).toHaveBeenCalledWith(createCategoriesDto);
      expect(result).toStrictEqual([mockCategory]);
    });
  });

  describe('reorder', () => {
    it('should reorder categories', async () => {
      const categories = [
        { id: '1', order: 1 },
        { id: '2', order: 2 },
      ];

      categoriesService.reorder.mockResolvedValue([mockCategory]);

      const result = await controller.reorder(categories);

      expect(categoriesService.reorder).toHaveBeenCalledWith(categories);
      expect(result).toStrictEqual([mockCategory]);
    });
  });
});
