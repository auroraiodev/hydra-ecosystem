import { INestApplication } from '@nestjs/common';
import { setupCors } from './cors.config.js';

describe('CORS Configuration', () => {
  let app: Partial<INestApplication>;
  let corsOptions: any;

  beforeEach(() => {
    app = {
      enableCors: jest.fn().mockImplementation((options) => {
        corsOptions = options;
      }),
    };
    process.env.FRONTEND_URL =
      'https://hydra-fe.vercel.app,https://www.hydracollect.com,https://hydracollect.com,https://custom-domain.com,https://staging.hydracollect.com';
    process.env.ADMIN_URL = 'https://hydra-admin-dashboard.vercel.app,https://hydra-ad.vercel.app';
    process.env.SELLER_URL = 'http://localhost:3003';
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
    delete process.env.ADMIN_URL;
    delete process.env.SELLER_URL;
  });

  it('should allow the production admin dashboard origin', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback('https://hydra-admin-dashboard.vercel.app', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should allow the production frontend origin', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback('https://hydra-fe.vercel.app', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should allow hydracollect.com origins', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const cbWww = jest.fn();
    const cbApex = jest.fn();
    originCallback('https://www.hydracollect.com', cbWww);
    expect(cbWww).toHaveBeenCalledWith(null, true);
    originCallback('https://hydracollect.com', cbApex);
    expect(cbApex).toHaveBeenCalledWith(null, true);
  });

  it('should allow localhost:3000 and localhost:3001', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    originCallback('http://localhost:3000', cb1);
    expect(cb1).toHaveBeenCalledWith(null, true);
    originCallback('http://localhost:3001', cb2);
    expect(cb2).toHaveBeenCalledWith(null, true);
  });

  it('should block unauthorized origins', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback('https://malicious-site.com', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should allow the admin app origin hydra-ad.vercel.app', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback('https://hydra-ad.vercel.app', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should block the removed hydra-be.vercel.app origin', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback('https://hydra-be.vercel.app', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should allow requests with no origin (mobile/curl)', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const callback = jest.fn();
    originCallback(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should respect origins added via FRONTEND_URL env var', () => {
    setupCors(app as INestApplication);
    const originCallback = corsOptions.origin;
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    originCallback('https://custom-domain.com', cb1);
    expect(cb1).toHaveBeenCalledWith(null, true);
    originCallback('https://staging.hydracollect.com', cb2);
    expect(cb2).toHaveBeenCalledWith(null, true);
  });
});
