# Title: PyThaiNLP (Thai Natural Language Processing)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**PyThaiNLP** เป็นไลบรารีภาษา Python สำหรับจัดการและประมวลผลภาษาธรรมชาติภาษาไทย (Thai NLP) ที่มีฟังก์ชันพื้นฐานครบถ้วน:
1. **Linguistic Unit Tokenization:** ตัดประโยค (`sent_tokenize`), ตัดคำภาษาไทย (`word_tokenize`), และตัดหน่วยย่อย (`subword_tokenize`)
2. **Text Correction & Checking:** แนะนำคำสะกดผิด แก้ไขคำ และคำนวณเสียงอ่านภาษาไทย (Soundex)
3. **Thai Utilities:** ฟังก์ชันแปลงตัวเลขจำนวนเงินเป็นอักษรไทย (`bahttext`), จัดรูปแบบวันที่ภาษาไทย (`thai_strftime`), และแก้ปัญหาการพิมพ์ภาษาไทยลืมเปลี่ยนคีย์บอร์ด

## 2. Technical Code Snippet (Best Practice)

### การตัดคำและการเช็คคำสะกดด้วย PyThaiNLP
```python
from pythainlp import word_tokenize
from pythainlp.spell import correct, spell
from pythainlp.util import bahttext

# 1. การตัดคำภาษาไทย (ค่าเริ่มต้นคือเครื่องมือใหม่ที่สุด/เสถียรที่สุด)
text = "ระบบจัดการงาน Rework QSMS ทำงานได้รวดเร็ว"
words = word_tokenize(text, keep_whitespace=False)
print("Words:", words) # ['ระบบ', 'จัดการ', 'งาน', 'Rework', 'QSMS', 'ทำงาน', 'ได้', 'รวดเร็ว']

# 2. การตรวจแก้คำสะกดผิด
misspelled = "กะทะ"
suggestions = spell(misspelled)
corrected = correct(misspelled)
print(f"Spell check suggestions for '{misspelled}': {suggestions} -> Best: {corrected}")

# 3. การแปลงมูลค่าเงินบาทเป็นคำเขียน
money_text = bahttext(1250.50)
print(money_text) # หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์
```

### การตั้งค่าการจำกัดสิทธิ์เขียนไฟล์ในสภาพแวดล้อมจำกัด (Read-only / Cloud Node)
ในกรณีรันบน Docker หรือ Kubernetes ที่เมานต์ไดเรกทอรีแบบอ่านอย่างเดียว ให้เปิด environment variables เพื่อปิดการเขียนหรือดาวน์โหลดฐานข้อมูลเบื้องหลังอัตโนมัติ:
```bash
export PYTHAINLP_OFFLINE=1
export PYTHAINLP_READ_ONLY=1
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (ความเข้าใจในโครงสร้างภาษาธรรมชาติยุค AI)
