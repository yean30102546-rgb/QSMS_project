const url = "https://script.google.com/macros/s/AKfycbyX9Js9aIxdexQUTARb8ANBYf16fJq8h1kFpR9uEEHo-ZRCHvPZJ5Ipgq-Cceh6PGgT/exec";

// Fetch item master
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'getItemMaster' })
})
.then(res => res.json())
.then(data => {
  console.log("Response:", JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
