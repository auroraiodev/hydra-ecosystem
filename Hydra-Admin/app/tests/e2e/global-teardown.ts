declare const require: any;
const { execSync } = require('child_process');

async function globalTeardown() {
  console.log('Cleaning up manual browser processes...');
  try {
    execSync('taskkill /F /IM chrome-headless-shell.exe /T', { stdio: 'ignore' });
    console.log('Successfully killed chrome-headless-shell processes.');
  } catch (e) {
    // Process might have already exited
  }
}

export default globalTeardown;
