import { Test, TestingModule } from '@nestjs/testing';
import { TcgsController } from './tcgs.controller';
import { TcgsService } from './tcgs.service';
import { CreateTcgDto } from './dto/create-tcg.dto';
import { UpdateTcgDto } from './dto/update-tcg.dto';

describe('TcgsController', () => {
  let controller: TcgsController;
  let tcgsService: jest.Mocked<TcgsService>;

  const mockTcg = {
    id: '1',
    name: 'Magic',
    display_name: 'Magic: The Gathering',
    is_active: true,
    order: 1,
    icon_url: null,
    logo_url: null,
    loader_url: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockTcgsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TcgsController],
      providers: [{ provide: TcgsService, useValue: mockTcgsService }],
    }).compile();

    controller = module.get<TcgsController>(TcgsController);
    tcgsService = module.get(TcgsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a TCG', async () => {
      const createTcgDto: CreateTcgDto = {
        name: 'Magic',
        display_name: 'Magic: The Gathering',
        is_active: true,
      };

      tcgsService.create.mockResolvedValue(mockTcg);

      const result = await controller.create(createTcgDto);

      expect(tcgsService.create).toHaveBeenCalledWith(createTcgDto);
      expect(result).toBe(mockTcg);
    });
  });

  describe('findAll', () => {
    it('should return all TCGs', async () => {
      const expectedResult = [mockTcg];

      tcgsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(tcgsService.findAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findActive', () => {
    it('should return active TCGs', async () => {
      const expectedResult = [mockTcg];

      tcgsService.findActive.mockResolvedValue(expectedResult);

      const result = await controller.findActive();

      expect(tcgsService.findActive).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a TCG by ID', async () => {
      const id = '1';
      const expectedResult = { ...mockTcg, singles: [{ id: 's1' }] };

      tcgsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(tcgsService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a TCG', async () => {
      const id = '1';
      const updateTcgDto: UpdateTcgDto = { display_name: 'Updated TCG Name' };
      const expectedResult = { ...mockTcg, ...updateTcgDto };

      tcgsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateTcgDto);

      expect(tcgsService.update).toHaveBeenCalledWith(id, updateTcgDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a TCG', async () => {
      const id = '1';
      const expectedResult = { id, singlesDeleted: 0, categoriesDeleted: 0 };

      tcgsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(tcgsService.remove).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });
});
