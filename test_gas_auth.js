import dotenv from 'dotenv';

dotenv.config();

const gasUrl = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();
const profile = String(process.env.GAS_TEST_PROFILE || '').trim().toUpperCase();
const password = String(process.env.GAS_TEST_PASSWORD || '').trim();
const allowWrite = String(process.env.GAS_TEST_ALLOW_WRITE || '').trim().toLowerCase() === 'true';

if (!gasUrl) {
  console.error('REACT_APP_GAS_WEB_APP_URL is not set.');
  process.exit(1);
}

if (!profile || !password) {
  console.log('Skipping authenticated GAS test.');
  console.log('Set GAS_TEST_PROFILE and GAS_TEST_PASSWORD to run login -> readAll -> getItemMaster.');
  process.exit(0);
}

async function post(body) {
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });

  return response.json();
}

async function login() {
  const result = await post({
    action: 'loginWithPassword',
    profile,
    password,
  });

  if (!result.success || !result.data?.token) {
    throw new Error(result.error || 'Login failed');
  }

  return {
    token: result.data.token,
    authProfile: profile,
    authEmail: result.data.user?.email || '',
    user: result.data.user,
  };
}

async function runReadOnlyFlow(auth) {
  const readAll = await post({
    action: 'readAll',
    token: auth.token,
    authProfile: auth.authProfile,
    authEmail: auth.authEmail,
  });

  const itemMaster = await post({
    action: 'getItemMaster',
    token: auth.token,
    authProfile: auth.authProfile,
    authEmail: auth.authEmail,
  });

  return {
    readAll,
    itemMaster,
  };
}

async function runOptionalWriteFlow(auth) {
  if (!allowWrite) {
    return { skipped: true, reason: 'Set GAS_TEST_ALLOW_WRITE=true to enable write flow.' };
  }

  const insertPayload = {
    action: 'insert',
    source: 'SFC',
    items: [
      {
        itemNumber: `AUTHTEST${Date.now()}`,
        itemName: 'Authenticated GAS Test',
        itemCode: '123456',
        amount: 1,
        reason: 'เธญเธทเนเธเน',
        reasonSubtype: '',
        responsible: 'SFC',
        responsibleSubtype: 'PDF',
        details: 'Created by automated authenticated GAS test',
        images: [],
      },
    ],
    token: auth.token,
    authProfile: auth.authProfile,
    authEmail: auth.authEmail,
  };

  const insertResult = await post(insertPayload);
  let updateResult = null;

  if (insertResult.success && insertResult.data?.caseId) {
    updateResult = await post({
      action: 'update',
      caseId: insertResult.data.caseId,
      updates: { status: 'Completed' },
      token: auth.token,
      authProfile: auth.authProfile,
      authEmail: auth.authEmail,
    });
  }

  return {
    insertResult,
    updateResult,
  };
}

async function main() {
  console.log('Logging in with GAS profile...');
  const auth = await login();
  console.log({
    success: true,
    user: auth.user,
  });

  console.log('\nRunning authenticated read-only flow...');
  const readOnlyResults = await runReadOnlyFlow(auth);
  console.log(JSON.stringify(readOnlyResults, null, 2));

  console.log('\nRunning optional write flow...');
  const writeResults = await runOptionalWriteFlow(auth);
  console.log(JSON.stringify(writeResults, null, 2));
}

main().catch((error) => {
  console.error('Authenticated GAS test failed:', error);
  process.exit(1);
});
