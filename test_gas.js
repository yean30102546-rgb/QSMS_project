const url = "https://script.google.com/macros/s/AKfycbxTOc3JkCV-07tTHiRZfHq5kncjbvPfRt4ZXH4ViP451DDZCJu8J3jL3vpnCoxkdGGs/exec";
const payload = {
  action: 'insert',
  source: 'SFC',
  items: [
    {
      itemNumber: '123A',
      itemName: '',
      itemCode: 'ABC',
      amount: 0,
      reason: '',
      responsible: ''
    }
  ],
  token: 'dummy',
  authProfile: 'QSMS',
  authEmail: 'qsms@example.com'
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
