import { Controller, Get, Logger, Param, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../common/storage/storage.service.js';
import { Public } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

function validatePathComponent(value: string, label: string): void {
  if (
    !value ||
    value.includes('..') ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('\0')
  ) {
    throw new BadRequestException(`Invalid ${label}: path traversal detected`);
  }
}

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get(':folder/:filename')
  @Public()
  @ApiOperation({
    summary: 'Get an image by folder and filename',
    description:
      'Proxies image files from storage (S3/local filesystem). ' +
      'Supports webp, png, gif, and jpeg formats. Cached for 24 hours.',
  })
  @ApiParam({
    name: 'folder',
    type: String,
    description: 'Storage folder (e.g. "products", "avatars")',
    example: 'products',
  })
  @ApiParam({
    name: 'filename',
    type: String,
    description: 'Image filename with extension',
    example: 'abc123.webp',
  })
  @ApiResponse({ status: 200, description: 'Image file streamed.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  async getImage(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    validatePathComponent(folder, 'folder');
    validatePathComponent(filename, 'filename');
    const key = `${folder}/${filename}`;
    this.logger.debug(`Proxying image: ${key}`);

    try {
      const stream = await this.storageService.getObjectStream(key);

      const ext = filename.split('.').pop()?.toLowerCase();
      const contentType =
        ext === 'webp'
          ? 'image/webp'
          : ext === 'png'
            ? 'image/png'
            : ext === 'gif'
              ? 'image/gif'
              : 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      stream.pipe(res);
    } catch (error) {
      this.logger.warn(`Image not found in storage: ${key} (${error.message || error})`);
      res.status(404).end();
    }
  }
}
