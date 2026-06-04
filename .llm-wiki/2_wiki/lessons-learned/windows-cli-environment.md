# Title: Windows CLI Environment & Unzip command workaround
[Updated: 2026-06-04]

## 1. Summary & Current Implementation
เมื่อทำการรันคำสั่งบางอย่างใน Windows CLI (เช่น `npx impeccable skills install`) ที่มีการใช้คำสั่ง `unzip` ภายใน จะเกิด Error: `'unzip' is not recognized as an internal or external command`. เพื่อแก้ไขปัญหานี้ เราสามารถนำ utility ของ Git for Windows (ซึ่งมี `unzip.exe` อยู่ในโฟลเดอร์ `usr/bin`) มาใช้ได้โดยการเพิ่มเข้าไปใน PATH ชั่วคราว

## 2. Technical Code Snippet (Best Practice)
รันคำสั่งโดยการเพิ่ม PATH ไปยัง Git `usr/bin` ชั่วคราวก่อนเริ่มรันคำสั่ง:
```powershell
$env:PATH = "C:\Users\tatsanai.bu\AppData\Local\Programs\Git\usr\bin;" + $env:PATH; <your-command-here>
```

หรือสามารถหาตำแหน่งติดตั้ง Git ในระบบโดยใช้:
```powershell
$gitPath = (Get-Command git).Source
$gitDir = Split-Path (Split-Path $gitPath -Parent) -Parent
$unzipPath = Join-Path $gitDir "usr\bin"
$env:PATH = "$unzipPath;" + $env:PATH
```

## 3. Knowledge Relationships
- Depends On (must read): [[index.md]]
