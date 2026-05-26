import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import FormData from 'form-data';
import Jimp from 'jimp';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly apiUrl = 'https://api.ocr.space/parse/image';

  async extractText(imageBuffer: Buffer): Promise<{ text: string; image: string }> {
    try {
      this.logger.log('Processing image with OCR.space API...');

      // Step 1: Normalize the image (Rotate & Resize first)
      const image = await Jimp.read(imageBuffer);
      // Jimp automatically respects EXIF rotation on read.
      if (image.getWidth() > 1024) {
        image.resize(1024, Jimp.AUTO);
      }

      // Step 2: Define Crop Region on the normalized image
      const width = image.getWidth();
      const height = image.getHeight();

      // Target the Title Bar (Center of Image, matching UI Frame)
      // The UI frame is centered. So we crop the Center Strip.
      const cropWidth = Math.floor(width * 0.9);
      const cropHeight = Math.floor(cropWidth / 4.0); // Aspect Ratio 4.0 matches UI
      const cropLeft = Math.floor((width - cropWidth) / 2);
      const cropTop = Math.floor((height - cropHeight) / 2);

      image.crop(cropLeft, cropTop, cropWidth, cropHeight);
      image.greyscale();

      const finalBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      const imageBase64 = `data:image/jpeg;base64,${finalBuffer.toString('base64')}`;

      const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';

      const formData = new FormData();
      formData.append('base64Image', imageBase64);
      formData.append('apikey', apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('isTable', 'true');

      const headers = formData.getHeaders();
      try {
        headers['Content-Length'] = formData.getLengthSync().toString();
      } catch {
        this.logger.warn('Could not compute formData length synchronously');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: headers,
        body: formData as any,
        signal: AbortSignal.timeout(50000),
      });

      if (!response.ok) {
        throw new Error(`OCR API responded with status: ${response.status}`);
      }

      const responseData: any = await response.json();

      if (responseData.IsErroredOnProcessing) {
        this.logger.error(`OCR.space Error: ${responseData.ErrorMessage}`);
        throw new InternalServerErrorException(responseData.ErrorMessage?.[0] || 'OCR API Error');
      }

      const parsedResults = responseData.ParsedResults;
      const text = parsedResults?.[0]?.ParsedText || '';
      const sanitizedText = this.sanitizeText(text);

      return { text: sanitizedText, image: imageBase64 };
    } catch (error) {
      this.logger.error('Error processing OCR', error);
      throw new InternalServerErrorException('Failed to process image with OCR API');
    }
  }

  private sanitizeText(text: string): string {
    if (!text) return '';

    // Split by newlines to get the title (usually the first line in isTable mode)
    const lines = text
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 2); // Filter noise

    this.logger.log(`OCR Lines Detected: ${JSON.stringify(lines)}`);

    if (lines.length === 0) return '';

    let titleLine = lines[0];

    // Remove common trademark symbols and non-text noise from start/end
    titleLine = titleLine.replace(/[©®™]/g, '');
    titleLine = titleLine.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

    // Collapse multiple spaces
    titleLine = titleLine.replace(/\s+/g, ' ');

    return titleLine.trim();
  }
}
