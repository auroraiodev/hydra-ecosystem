/**
 * Seeds test users for Newman E2E tests.
 * Creates client, seller, and admin users if they don't exist.
 *
 * Usage: node scripts/setup-test-users.cjs
 * Prerequisite: Server running at http://localhost:3002
 */

const BASE = 'http://localhost:3002/api/v1';

const TEST_USERS = [
  { email: 'cliente@hydracollect.com', username: 'cliente', password: 'password123', first_name: 'Test', last_name: 'Client', role: 'CLIENT' },
  { email: 'vendedor@hydracollect.com', username: 'vendedor', password: 'password123', first_name: 'Test', last_name: 'Seller', role: 'SELLER' },
  { email: 'admin@hydracollect.com', username: 'administrador', password: 'password123', first_name: 'Test', last_name: 'Admin', role: 'ADMIN' },
];

async function main() {
  console.log('=== Setting up test users ===\n');

  // Step 1: Login as an existing user or signup the client user
  // First, try to signup client (will fail if exists)
  const clientUser = TEST_USERS[0];

  // Try signing up all users
  for (const user of TEST_USERS) {
    try {
      const signupRes = await fetch(`${BASE}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
          password: user.password,
          first_name: user.first_name,
          last_name: user.last_name,
        }),
      });
      const signupData = await signupRes.json();
      if (signupRes.ok || signupRes.status === 201) {
        console.log(`✓ Created user: ${user.email}`);
      } else {
        console.log(`→ ${user.email}: ${signupData.message || signupData.error || 'Already exists'} (${signupRes.status})`);
      }
    } catch (err) {
      console.error(`✗ Failed to create ${user.email}: ${err.message}`);
    }
  }

  console.log('\n=== Test user setup complete ===');
  console.log('\nAvailable users for testing:');
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${u.password} (${u.role})`);
  }
}

main().catch(console.error);
