# Lessons Learned: Rework Form Refactoring & PDF Export Wrapping
[Updated: 2026-06-04]

## 1. Summary & Current Implementation
บันทึกบทเรียนจากการ Refactor ระบบฟอร์มใน Add Case Tab ของระบบ Rework และปัญหาการแสดงผลภาษาไทยใน PDF:
1. **Form Refactoring**: เปลี่ยนจาก God State component ไปเป็น `react-hook-form` + `zod` เพื่อแก้ปัญหา Re-render performance และเพิ่มความเสถียรในการทำงานร่วมกับ Custom Hook `useItemVerification`
2. **Form Context Trap**: การเรียกใช้ `useFormContext()` ของ `react-hook-form` ภายใน Custom hook จะคืนค่าเป็น `null` หากเรียกใช้ในระดับเดียวกับ Component ที่ประกาศ `<FormProvider>` (ต้องอยู่ภายใต้ลูกเท่านั้น) วิธีแก้คือส่งผ่าน `getValues` และ `setValue` เป็น Props แทน
3. **Thai Text Clipping in PDF**: ภาษาไทยไม่มีช่องว่างระหว่างคำ ทำให้ PDF Engine หรือ HTML-to-PDF Renderer ไม่สามารถตัดบรรทัด (Word Wrap) ได้และเกิดอาการข้อความล้นหลุดขอบ (Clipped) แก้ไขโดยการใช้ฟังก์ชันแทรก Zero-Width Space (`\u200B`)

## 2. Technical Code Snippet (Best Practice)

### 2.1 Passing Form Props instead of useFormContext in Root hooks
เมื่อมี Custom Hook ที่ต้องถูกใช้งานในระดับ Root Component ที่จัดทำ `<FormProvider>`:
```typescript
// useItemVerification.ts
interface UseItemVerificationProps {
  onConflict: () => void;
  onAutofillTriggered: (itemId: string) => void;
  getValues: UseFormGetValues<any>;
  setValue: UseFormSetValue<any>;
}

export function useItemVerification({ onConflict, onAutofillTriggered, getValues, setValue }: UseItemVerificationProps) {
  // ดึง items พร้อมระบุ Type เพื่อหลีกเลี่ยง implicit any
  const allItems = getValues('items') as ReworkItem[];
  // ... verification logic ...
}
```

ใน Root Component:
```tsx
// AddCaseTab.tsx
const methods = useForm<FormValues>({ ... });
const { getValues, setValue } = methods;

const { triggerDebouncedVerification } = useItemVerification({
  onConflict: () => setIsConflictModalOpen(true),
  onAutofillTriggered: (itemId) => { ... },
  getValues,
  setValue
});

return (
  <FormProvider {...methods}>
    <form>...</form>
  </FormProvider>
);
```

### 2.2 Thai Word Wrapping Utility (Zero-Width Space)
แก้ข้อความภาษาไทยยาวๆ ใน PDF ถูกหั่นครึ่งหรือถูกตัด โดยการแทรกตัวอักษรล่องหนเพื่อให้ Word-wrap ตัดคำได้:
```typescript
export function insertZeroWidthSpaces(text: string): string {
  if (!text) return '';
  // แทรก Zero-Width Space (\u200B) เพื่อให้ Layout Engine สามารถตัดบรรทัดภาษาไทยได้ถูกต้อง
  return text.split('').join('\u200B');
}
```
ใน PDF Template:
```tsx
<Text style={styles.longText}>
  {insertZeroWidthSpaces(item.remarks || '-')}
</Text>
```

## 3. Knowledge Relationships
- Depends On (must read): [[src/components/tabs/AddCaseTab.tsx]], [[src/hooks/useItemVerification.ts]]
- Impacted By (changes affect): [[src/components/ui/ExportPDFTemplate.tsx]], [[src/components/ui/ExportTemplate.tsx]]
