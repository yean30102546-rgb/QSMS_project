# Ponytail — The Laziness Ladder (Write Less Code)
[วันที่สร้าง: 2026-06-29]
**Source**: `1_raw/DietrichGebertponytail Makes your AI agent think like the laziest senior dev in the room. The best code is the code you never wrote.md`

## 1. Summary
สรุปหลักการทำงานของ **Ponytail** ซึ่งเป็นปลั๊กอินและข้อกำหนดทางสากลสำหรับ AI coding agents เพื่อส่งเสริมวิธีคิดเหมือน **"โปรแกรมเมอร์รุ่นเก๋าที่ขี้เกียจที่สุด"** โดยเน้นการมองหาหนทางแก้ปัญหาด้วยวิธีที่เขียนโค้ดน้อยที่สุด (หรือตัดทิ้ง) เพื่อลดปริมาณโค้ดบรรทัดสะสม (LOC), ลด Token, เพิ่มความรวดเร็ว และประหยัดค่าใช้จ่าย โดยสถิติเฉลี่ยช่วยลดโค้ดลงถึง ~54% (และสูงถึง 94% ในเคสที่ AI ชอบ over-engineer เช่น สร้าง Date Picker ขึ้นมาใช้เอง)

---

## 2. Key Details — The Laziness Ladder
ก่อนที่จะลงมือเขียนโค้ดขึ้นมาใหม่ เอเจนต์ต้องหยุดและพิจารณา "บันไดขี้เกียจ" 7 ขั้นนี้ เรียงตามความสำคัญจากบนลงล่าง:

```text
[บันไดขี้เกียจ 7 ขั้นของ Ponytail]
1. สิ่งนี้จำเป็นต้องมีหรือไม่?          → หากไม่จำเป็น: ข้ามไปเลย (YAGNI)
2. มีของเดิมในโปรเจกต์อยู่แล้วหรือไม่?  → นำมาใช้ซ้ำ อย่าเขียนใหม่
3. Standard Library ทำได้หรือไม่?     → ใช้ Standard Library
4. เป็นความสามารถติดตัวของเบราว์เซอร์/OS? → ใช้ของดิบ (เช่น <input type="date">)
5. มี Library ที่ติดตั้งไว้อยู่แล้ว?      → เรียกใช้ Dependency ที่มีอยู่
6. แก้จบในบรรทัดเดียวได้หรือไม่?       → เขียนแบบ One-line
7. หากผ่าน 6 ขั้นบนหมด:               → เขียนโค้ดใหม่ด้วยจำนวนที่น้อยที่สุดเท่าที่ทำงานได้
```

### ⚠️ กฎเหล็ก: ขี้เกียจแต่ห้ามละเลยความปลอดภัย (Lazy, not Negligent)
การลดบรรทัดโค้ดห้ามไปกระทบกับ:
- **Trust-boundary validation** (การตรวจรับข้อมูลฝั่งเซิร์ฟเวอร์)
- **Data-loss handling** (การป้องกันข้อมูลสูญหาย)
- **Security & Vulnerability** (ความปลอดภัยของระบบ)
- **Accessibility** (การเข้าถึงสำหรับผู้พิการ)

### เครื่องมือและคำสั่ง (Commands)
- `/ponytail-review`: ตรวจสอบ Git Diff ล่าสุดและประเมินว่ามีการ Over-engineer หรือเขียนโค้ดเยอะเกินไปหรือไม่ พร้อมให้ Delete-list
- `/ponytail-audit`: ตรวจสอบโค้ดทั้ง Repository เพื่อหาจุดรกรุงรังที่ควร Refactor ให้เล็กลง
- `/ponytail-debt`: ติดตามคอมเมนต์ทางลัด `ponytail:` ที่ทำเครื่องหมายข้ามไว้ใช้งานภายหลัง

---

## 3. Knowledge Relationships
- **Impacts**: [[../../AGENTS.md]] — กฎการทำงานของบรรณารักษ์เพื่อตรวจสอบความเรียบง่ายและเป็นระบบ
- **Depends On**: [[agent-dev-thai.md]] — การใช้ Guardrails ควบคุมขอบเขตงานของเอเจนต์
- **Impacted By**: [[../lessons-learned/ui-libraries-resource.md]] — สอดคล้องกับแนวคิดของ Mantine UI ที่มี hooks/components พร้อมใช้โดยไม่ต้องสร้างใหม่
