const newman = require('newman');
const path = require('path');
const { execSync } = require('child_process');

const COLLECTION = path.join(__dirname, 'hydra-be-comprehensive.postman_collection.json');
const ENVIRONMENT = path.join(__dirname, 'hydra-be-comprehensive-env.postman_environment.json');

// Seed test users if they don't exist
console.log('=== Seeding Test Users ===');
try {
  execSync('bun run scripts/seed-test-users.ts', {
    cwd: __dirname,
    stdio: 'inherit',
  });
} catch (err) {
  console.log('Note: User seeding had issues, continuing anyway...');
}

// First, generate the collection
console.log('\n=== Generating Comprehensive Test Collection ===');
try {
  execSync('bun run scripts/generate-comprehensive-collection.cjs', {
    cwd: __dirname,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Failed to generate collection:', err.message);
  process.exit(1);
}

const collection = require(COLLECTION);
const environment = require(ENVIRONMENT);

console.log('\n=== Hydra BE — Comprehensive API Test Suite ===');
console.log(`Collection: ${collection.info.name}`);
console.log(`Total folders: ${collection.item.length}`);
const totalReqs = collection.item.reduce((acc, f) => acc + f.item.length, 0);
console.log(`Total endpoints: ${totalReqs}`);
console.log('');

newman.run(
  {
    collection,
    environment,
    reporters: ['cli'],
    timeoutRequest: 15000,
    delayRequest: 100,
    bail: false,
    insecure: true,
    verbose: false,
  },
  (err, summary) => {
    if (err) {
      console.error('Newman run failed:', err);
      process.exit(1);
    }

    console.log('\n=== COMPREHENSIVE TEST SUMMARY ===');
    const run = summary.run;
    const stats = run.stats;
    const failures = run.failures || [];

    const totalReqs = stats.requests?.total || 0;
    const failedReqs = stats.requests?.failed || 0;
    const totalAssertions = stats.assertions?.total || 0;
    const failedAssertions = stats.assertions?.failed || 0;

    const passedReqs = totalReqs - failedReqs;
    const passedAssertions = totalAssertions - failedAssertions;

    console.log(`Total requests:       ${totalReqs}`);
    console.log(`Passed:               ${passedReqs}`);
    console.log(`Failed:               ${failedReqs}`);
    console.log(`Pass rate:            ${totalReqs ? ((passedReqs / totalReqs) * 100).toFixed(1) : 'N/A'}%`);
    console.log(`Assertions total:     ${totalAssertions}`);
    console.log(`Assertions passed:    ${passedAssertions}`);
    console.log(`Assertions failed:    ${failedAssertions}`);

    if (run.timings) {
      const ms = (run.timings.completed ?? run.timings.started) - run.timings.started;
      console.log(`Run duration:         ${(ms / 1000).toFixed(1)}s`);
    }

    if (failures.length > 0 || failedAssertions > 0) {
      console.log('\n=== FAILURES ===');
      const toShow = failures.slice(0, 50);
      for (const f of toShow) {
        const name = f.source?.name || 'Unknown';
        const err = f.error?.test || f.error?.message || 'Unknown error';
        console.log(`\n  [${name}]`);
        console.log(`    ${err}`);
      }
      if (failures.length > 50) {
        console.log(`\n  ... and ${failures.length - 50} more`);
      }
      process.exit(1);
    } else {
      console.log('\n\u2713 ALL COMPREHENSIVE TESTS PASSED!');
      process.exit(0);
    }
  },
);
