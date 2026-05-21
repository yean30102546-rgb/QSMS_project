async function run() {
  console.log('Fetching cases from local API...');
  try {
    const response = await fetch('http://localhost:3000/api/rework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetchAllCases' })
    });
    console.log('Status:', response.status);
    const json = await response.json();
    console.log('Success:', json.success);
    if (json.success) {
      console.log(`Found ${json.data.length} cases.`);
      if (json.data.length > 0) {
        console.log('Sample case properties:', Object.keys(json.data[0]));
        console.log('Sample case items properties:', json.data[0].items[0] ? Object.keys(json.data[0].items[0]) : 'no items');
      }
    } else {
      console.error('API Error:', json.error || json);
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
run();
