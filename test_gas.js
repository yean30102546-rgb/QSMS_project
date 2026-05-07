import dotenv from 'dotenv';

dotenv.config();

const gasUrl = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

if (!gasUrl) {
  console.error('REACT_APP_GAS_WEB_APP_URL is not set.');
  process.exit(1);
}

async function main() {
  console.log('Testing GAS health endpoint...');
  const healthResponse = await fetch(gasUrl, { method: 'GET' });
  const healthBody = await healthResponse.text();
  console.log({
    status: healthResponse.status,
    ok: healthResponse.ok,
    body: healthBody,
  });

  console.log('\nTesting authenticated endpoint contract...');
  const authResponse = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'readAll' }),
  });
  const authBody = await authResponse.json();
  console.log(authBody);

  console.log('\nExpected result:');
  console.log('- GET should return success=true health message');
  console.log('- POST without token should return success=false with statusCode 401');
}

main().catch((error) => {
  console.error('GAS test failed:', error);
  process.exit(1);
});
