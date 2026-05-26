const newman = require('newman');
const path = require('path');
const { execSync } = require('child_process');

const GENERATED_COLLECTION = path.join(__dirname, 'hydra-be-contract.postman_collection.json');
const ENVIRONMENT = path.join(__dirname, 'hydra-be-contract-env.postman_environment.json');

// Seed test users
console.log('=== Seeding Test Users ===');
try {
  execSync('bun run scripts/seed-test-users.ts', {
    cwd: __dirname,
    stdio: 'inherit',
  });
} catch (err) {
  console.log('Note: User seeding had issues, continuing anyway...');
}

// Generate contract collection from live spec
console.log('\n=== Generating Contract Test Collection ===');
try {
  execSync('bun run scripts/generate-contract-collection.cjs', {
    cwd: __dirname,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Failed to generate contract collection:', err.message);
  process.exit(1);
}

const collection = require(GENERATED_COLLECTION);
const environment = require(ENVIRONMENT);

console.log('\n=== Hydra BE — E2E Contract Tests ===');
console.log(`Collection: ${collection.info.name}`);
console.log(`Total folders: ${collection.item.length}`);
const totalReqs = collection.item.reduce((acc, f) => {
  if (f.item) {
    if (Array.isArray(f.item)) {
      return acc + f.item.length;
    }
    return acc + 1;
  }
  return acc;
}, 0);
console.log(`Total contract endpoints: ${totalReqs}`);
console.log('');

newman.run(
  {
    collection,
    environment,
    reporters: ['cli'],
    timeoutRequest: 15000,
    delayRequest: 50,
    bail: false,
    insecure: true,
    verbose: false,
  },
  (err, summary) => {
    if (err) {
      console.error('Newman run failed:', err);
      process.exit(1);
    }

    console.log('\n=== CONTRACT TEST SUMMARY ===');
    const run = summary.run;
    const stats = run.stats;
    const failures = run.failures || [];

    const totalReqs = stats.requests?.total || 0;
    const failedReqs = stats.requests?.failed || 0;
    const totalAssertions = stats.assertions?.total || 0;
    const failedAssertions = stats.assertions?.failed || 0;

    const passedReqs = totalReqs - failedReqs;
    const passedAssertions = totalAssertions - failedAssertions;

    console.log(`Total requests:         ${totalReqs}`);
    console.log(`Passed:                 ${passedReqs}`);
    console.log(`Failed:                 ${failedReqs}`);
    console.log(`Request pass rate:      ${totalReqs ? ((passedReqs / totalReqs) * 100).toFixed(1) : 'N/A'}%`);
    console.log(`Assertions total:       ${totalAssertions}`);
    console.log(`Assertions passed:      ${passedAssertions}`);
    console.log(`Assertions failed:      ${failedAssertions}`);
    console.log(`Schema pass rate:       ${totalAssertions ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : 'N/A'}%`);

    if (run.timings) {
      const ms = (run.timings.completed ?? run.timings.started) - run.timings.started;
      console.log(`Run duration:           ${(ms / 1000).toFixed(1)}s`);
    }

    // Count schema validation assertions
    const schemaFailures = failures.filter(f =>
      f.error?.test?.includes('contract schema') ||
      f.error?.message?.includes('contract schema')
    );
    const statusFailures = failures.filter(f =>
      f.error?.test?.includes('Status code')
    );
    console.log(`Schema failures:        ${schemaFailures.length}`);
    console.log(`Status code failures:   ${statusFailures.length}`);

    if (failures.length > 0) {
      console.log('\n=== FAILURES ===');
      const toShow = failures.slice(0, 60);
      for (const f of toShow) {
        const name = f.source?.name || 'Unknown';
        const testName = f.error?.test || '';
        const message = f.error?.message || 'Unknown error';
        console.log(`\n  [${name}]`);
        if (testName) console.log(`    Test: ${testName}`);
        console.log(`    ${message}`);
      }
      if (failures.length > 60) {
        console.log(`\n  ... and ${failures.length - 60} more`);
      }
      process.exit(1);
    } else {
      console.log('\n✓ ALL CONTRACT TESTS PASSED!');
      process.exit(0);
    }
  },
);
