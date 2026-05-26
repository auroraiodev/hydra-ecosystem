import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../apps/catalog/src/search/search.service.js';

describe('AssistantService', () => {
  let service: AssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: SearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
