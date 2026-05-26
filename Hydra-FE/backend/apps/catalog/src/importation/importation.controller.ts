import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Public } from '@hydra/auth';
import { ImportationService } from './importation.service.js';

@Controller('importation')
export class ImportationController {
  constructor(private readonly importationService: ImportationService) {}

  @Public()
  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('rows') rows?: string,
    @Query('language') language?: string,
    @Query('foil') foil?: string,
    @Query('sort') sort?: string,
    @Query('includeOutOfStock') includeOutOfStock?: string,
  ) {
    if (!q?.trim()) throw new BadRequestException('q is required');
    return this.importationService.searchCards({
      query: q,
      page: page ? parseInt(page) : 1,
      rows: rows ? parseInt(rows) : 30,
      language,
      foil: foil === 'true',
      sort,
      includeOutOfStock: includeOutOfStock === 'true',
    });
  }

  @Public()
  @Get('price')
  async getVariantPrice(
    @Query('importationId') importationId: string,
    @Query('cardName') cardName: string,
    @Query('isFoil') isFoil?: string,
    @Query('language') language?: string,
  ) {
    if (!importationId?.trim() || !cardName?.trim()) {
      throw new BadRequestException('importationId and cardName are required');
    }
    return this.importationService.findVariant({
      importationId,
      cardName,
      isFoil: isFoil === 'true',
      language: language || 'ENGLISH',
    });
  }
}
