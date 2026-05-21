import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const gasUrl = process.env.GAS_WEB_APP_URL || '';

if (!gasUrl) {
  console.error('GAS_WEB_APP_URL is missing in .env');
  process.exit(1);
}

async function testGAS() {
  console.log(`Sending request to GAS Web App URL: ${gasUrl.substring(0, 60)}...`);
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'loginWithPassword',
        profile: 'QSMS',
        password: 'Qsms123'
      })
    });
    
    console.log('Response Status:', response.status);
    const text = await response.text();
    console.log('Raw Response Text:', text.substring(0, 300));
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON Success:', json.success);
      if (json.success) {
        console.log('Access token:', json.token ? 'Received' : 'Not received');
      } else {
        console.log('Error from GAS:', json.error);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Network or fetch error:', error.message);
  }
}

testGAS();
