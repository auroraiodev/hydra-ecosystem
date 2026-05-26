const newman = require('newman');

const collection = require('./hydra-be-e2e.postman_collection.json');
const environment = require('./hydra-be-e2e.postman_environment.json');

console.log('=== Hydra BE E2E Test Suite ===');
console.log(`Collection: ${collection.info.name}`);
console.log(`Total endpoints: ${collection.item.reduce((acc, f) => acc + f.item.length, 0)}`);
console.log(`Total folders: ${collection.item.length}`);
console.log('');

newman.run({
  collection,
  environment,
  reporters: ['cli'],
  timeoutRequest: 10000,
  delayRequest: 200,
  bail: false,
  insecure: true,
  verbose: false,
}, (err, summary) => {
  if (err) {
    console.error('Newman run failed:', err);
    process.exit(1);
  }

  console.log('\n=== TEST SUMMARY ===');
  const run = summary.run;
  const stats = run.stats;
  const failures = run.failures || [];

  const totalReqs = stats.requests?.total || 0;
  const failedReqs = stats.requests?.failed || 0;
  const totalAssertions = stats.assertions?.total || 0;
  const failedAssertions = stats.assertions?.failed || 0;
  const totalFailures = failures.length;
  const passedReqs = totalReqs - failedReqs;
  const passedAssertions = totalAssertions - failedAssertions;

  console.log(`Total requests: ${totalReqs}`);
  console.log(`Passed: ${passedReqs}`);
  console.log(`Failed: ${failedReqs}`);
  console.log(`Assertions total: ${totalAssertions}`);
  console.log(`Assertions passed: ${passedAssertions}`);
  console.log(`Assertions failed: ${failedAssertions}`);
  console.log(`Total failures (from run.failures): ${totalFailures}`);
  if (run.timings) {
    const duration = ((run.timings.completed ?? run.timings.started) - run.timings.started) / 1000;
    console.log(`Run duration: ${duration.toFixed(1)}s`);
  }

  if (totalFailures > 0 || failedAssertions > 0) {
    console.log('\n=== FAILURES ===');
    // Use run.failures which is the most reliable source
    const toShow = failures.slice(0, 30); // Show first 30
    for (const failure of toShow) {
      const name = failure.source?.name || 'Unknown';
      const err = failure.error?.test || failure.error?.message || 'Unknown error';
      console.log(`\n  [${name}]`);
      console.log(`    ${err}`);
    }
    if (failures.length > 30) {
      console.log(`\n  ... and ${failures.length - 30} more failures`);
    }
    process.exit(1);
  } else {
    console.log('\n\u2713 ALL TESTS PASSED!');
    process.exit(0);
  }
});
