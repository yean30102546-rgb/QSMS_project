// Browser-console helper for checking the deployed GAS endpoint.
// Usage:
// 1. Open the app in the browser
// 2. Paste this script into DevTools console
// 3. Run `testGasConnection()`

async function testGasConnection() {
  const gasUrl = window.prompt('GAS URL', window.localStorage.getItem('last_gas_url') || '');
  if (!gasUrl) {
    console.warn('No GAS URL provided');
    return;
  }

  window.localStorage.setItem('last_gas_url', gasUrl);

  console.log('Testing GAS GET health endpoint...');
  const healthResponse = await fetch(gasUrl, { method: 'GET' });
  const healthText = await healthResponse.text();
  console.log('GET result:', {
    status: healthResponse.status,
    ok: healthResponse.ok,
    body: healthText,
  });

  console.log('Testing protected POST contract (without token)...');
  const authResponse = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    mode: 'cors',
    body: JSON.stringify({ action: 'readAll' }),
  });
  const authJson = await authResponse.json();
  console.log('POST result:', authJson);

  return {
    health: {
      status: healthResponse.status,
      ok: healthResponse.ok,
      body: healthText,
    },
    protectedResult: authJson,
  };
}
