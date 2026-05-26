const newman = require('newman');

const collection = require('./hydra-be-seller-flow.postman_collection.json');
const environment = require('./hydra-be-seller-flow.postman_environment.json');

console.log('=== Hydra BE — Full Seller Flow E2E ===');
console.log(`Collection: ${collection.info.name}`);
console.log(`Folders: ${collection.item.length}`);
const totalReqs = collection.item.reduce((acc, f) => acc + f.item.length, 0);
console.log(`Requests: ${totalReqs}`);
console.log('');

newman.run(
  {
    collection,
    environment,
    reporters: ['cli'],
    timeoutRequest: 15000,
    delayRequest: 300,
    bail: false,
    insecure: true,
    verbose: false,
  },
  (err, summary) => {
    if (err) {
      console.error('Newman run failed:', err);
      process.exit(1);
    }

    console.log('\n=== SELLER FLOW TEST SUMMARY ===');
    const run = summary.run;
    const stats = run.stats;
    const failures = run.failures || [];

    const totalReqs = stats.requests?.total || 0;
    const failedReqs = stats.requests?.failed || 0;
    const totalAssertions = stats.assertions?.total || 0;
    const failedAssertions = stats.assertions?.failed || 0;

    console.log(`Total requests:     ${totalReqs}`);
    console.log(`Passed:             ${totalReqs - failedReqs}`);
    console.log(`Failed:             ${failedReqs}`);
    console.log(`Assertions total:   ${totalAssertions}`);
    console.log(`Assertions passed:  ${totalAssertions - failedAssertions}`);
    console.log(`Assertions failed:  ${failedAssertions}`);

    if (run.timings) {
      const ms = (run.timings.completed ?? run.timings.started) - run.timings.started;
      console.log(`Run duration:       ${(ms / 1000).toFixed(1)}s`);
    }

    if (failures.length > 0 || failedAssertions > 0) {
      console.log('\n=== FAILURES ===');
      const toShow = failures.slice(0, 40);
      for (const f of toShow) {
        const name = f.source?.name || 'Unknown';
        const err = f.error?.test || f.error?.message || 'Unknown error';
        console.log(`\n  [${name}]`);
        console.log(`    ${err}`);
      }
      if (failures.length > 40) {
        console.log(`\n  ... and ${failures.length - 40} more`);
      }
      process.exit(1);
    } else {
      console.log('\n\u2713 ALL SELLER FLOW TESTS PASSED!');
      process.exit(0);
    }
  },
);
