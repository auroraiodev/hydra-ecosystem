import { JwtService } from '@nestjs/jwt';

// Secrets are read from the environment — never hardcode production values here.
const SECRETS = [
  process.env.JWT_SECRET,
  'dev-jwt-secret-hydra-local-development-only',
].filter((s): s is string => Boolean(s));

async function main() {
  const url = 'http://127.0.0.1:3002/api/v1/auth/admin-login';
  const body = {
    email: process.env.ADMIN_EMAIL ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
  };

  console.log('Logging in to get JWT...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const token = data?.accessToken || data?.data?.accessToken;
  if (!token) {
    console.error('Failed to get token! Response was:', JSON.stringify(data));
    return;
  }

  console.log('Successfully got JWT!');
  
  for (const secret of SECRETS) {
    console.log(`\nTesting secret: "${secret}"`);
    const jwtService = new JwtService({ secret });
    try {
      const verified = jwtService.verify(token);
      console.log('Verification Success!');
      console.log('Verified Payload:', JSON.stringify(verified, null, 2));
      return;
    } catch (err: any) {
      console.log('Verification Failed:', err.message);
    }
  }
}

main().catch(console.error);
