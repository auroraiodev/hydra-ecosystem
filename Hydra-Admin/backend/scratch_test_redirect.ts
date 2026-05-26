import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/auth/src/app.module.js';
import * as http from 'http';

async function test() {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3004/auth/google/callback';
  process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres'; // dummy
  
  const app = await NestFactory.create(AppModule);
  // Disable database connection if possible, or catch errors
  
  const server = await app.listen(0);
  const address = server.address() as any;
  const port = address.port;
  console.log(`Test auth service running on port ${port}`);

  // Perform a request to /auth/google?redirect_to=https://qa.hydracollect.com
  const req = http.get(`http://localhost:${port}/auth/google?redirect_to=https://qa.hydracollect.com`, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    app.close().then(() => {
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
    app.close().then(() => {
      process.exit(1);
    });
  });
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
