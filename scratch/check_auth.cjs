
async function testLogin(url, profile, password) {
  console.log(`Testing ${profile} / ${password} on URL ${url.substring(0, 40)}...`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'loginWithPassword',
        profile: profile,
        password: password
      })
    });
    const text = await response.text();
    const result = JSON.parse(text);
    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
    return result.success;
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return false;
  }
}

async function run() {
  const url = 'https://script.google.com/macros/s/AKfycbxGz2TcoduCMDXzrvy2Rr0P68oOZKmMiBD0Eun9BuZj98C57jBGdUQPaota2nZ0PkA2/exec';
  const profiles = ['QSMS', 'WFG', 'FINANCE', 'ADMIN'];
  const passwords = ['Qsms123', 'Wfg123', 'Finance123', 'Admin123'];

  for (const p of profiles) {
    for (const pwd of passwords) {
      if (await testLogin(url, p, pwd)) {
        console.log(`!!! VALID CREDENTIALS FOUND !!! ${p} / ${pwd}`);
      }
    }
  }
}

run();
