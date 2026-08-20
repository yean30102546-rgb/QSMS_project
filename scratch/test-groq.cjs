require('dotenv').config({ path: '.env' });
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: 'Please output JSON with key "test" and value "ok"'
      }
    ],
    response_format: { type: 'json_object' }
  })
})
.then(r => r.json())
.then(console.log);
