import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * HaveIBeenPwned Password Check Service
 *
 * Uses the k-anonymity range API: https://haveibeenpwned.com/API/v3#PwnedPasswords
 * - SHA-1 hash the password
 * - Send only the first 5 hex chars (prefix) to the API — the plaintext never leaves
 * - HIBP returns all hashes sharing that prefix
 * - Check locally if the full hash suffix appears in the response
 *
 * This is completely FREE and requires no API key.
 * The plaintext password is never transmitted to HIBP.
 */
@Injectable()
export class HibpService {
  private readonly logger = new Logger(HibpService.name);
  private readonly HIBP_API_URL = 'https://api.pwnedpasswords.com/range';

  /**
   * Check whether a plaintext password appears in known data breaches.
   * Throws a BadRequestException if the password is compromised.
   *
   * @param password - The plaintext password to check
   * @param failOpen  - If true, validation passes even when HIBP is unreachable (default: true)
   */
  async assertNotPwned(password: string, failOpen = true): Promise<void> {
    try {
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const response = await fetch(`${this.HIBP_API_URL}/${prefix}`, {
        headers: {
          // Required user-agent per HIBP API terms
          'User-Agent': 'Hydra-Collectables/1.0',
          // Ask for padded responses (harder for traffic analysis)
          'Add-Padding': 'true',
        },
        signal: AbortSignal.timeout(3000), // 3 s timeout — never block signup
      });

      if (!response.ok) {
        this.logger.warn(`HIBP API returned ${response.status} — skipping check (fail-open)`);
        return; // fail-open: don't block the user if HIBP is down
      }

      const text = await response.text();
      const count = this.parseCount(text, suffix);

      if (count > 0) {
        this.logger.warn(`Compromised password attempt detected (breach count: ${count})`);
        throw new BadRequestException(
          'This password has appeared in a data breach and cannot be used. Please choose a different password.',
        );
      }

      this.logger.debug('Password passed HIBP check');
    } catch (error) {
      // Re-throw our own validation error untouched
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Network / timeout errors — fail-open or fail-closed based on config
      if (failOpen) {
        this.logger.warn(`HIBP check failed (network error) — fail-open: ${error.message}`);
        return;
      }

      this.logger.error(`HIBP check failed and fail-open=false: ${error.message}`);
      throw new BadRequestException(
        'Password validation service is temporarily unavailable. Please try again.',
      );
    }
  }

  /**
   * Parse the HIBP range response and return the breach count for the given suffix.
   * Response format: "SUFFIX:COUNT\r\n" per line (with optional padding lines whose count=0)
   */
  private parseCount(body: string, suffix: string): number {
    const lines = body.split('\n');
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return parseInt(countStr, 10) || 0;
      }
    }
    return 0;
  }
}
