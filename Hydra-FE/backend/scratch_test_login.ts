async function main() {
  const url = 'http://127.0.0.1:3002/api/v1/auth/admin-login';
  const body = {
    email: 'darmfma@gmail.com',
    password: 'De71ka82.',
  };

  console.log('Sending request to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
