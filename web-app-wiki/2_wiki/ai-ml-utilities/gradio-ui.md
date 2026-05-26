# Title: Gradio (Rapid Web UI Builder for Python)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**Gradio** เป็นแพ็กเกจภาษา Python แบบ Open-source สำหรับการสร้างหน้าเว็บอินเทอร์เฟซ (UI Demos) สำหรับทดสอบโมเดลปัญญาประดิษฐ์และฟังก์ชันคำสั่ง Python ต่างๆ ได้อย่างรวดเร็ว โดยไม่จำเป็นต้องเขียน HTML, CSS หรือ JavaScript:
1. **Interface Class:** คลาสระดับสูงสำหรับทำ UI ครอบคำสั่งฟังก์ชันระบุอินพุตและเอาต์พุต
2. **Blocks Layout Builder (gr.Blocks):** มีระดับความยืดหยุ่นสูงขึ้น สามารถกำหนด Layout แบบ Custom จัดตำแหน่งคอมโพเนนต์ ควบคุม Flow ของข้อมูลซับซ้อน และทำปุ่มโต้ตอบแบบกำหนดสิทธิ์
3. **Public Sharing Model:** การเปิดใช้งานลิงก์สาธารณะแบบชั่วคราว (`share=True`) ช่วยให้บุคคลอื่นสามารถเข้าใช้งานหน้าเว็บ UI ที่รันอยู่บนเครื่องคอมพิวเตอร์ของเราได้ทันทีผ่านเกตเวย์ของ Gradio

## 2. Technical Code Snippet (Best Practice)

### การสร้าง Interface แบบด่วน (gr.Interface)
```python
import gradio as gr

def rework_validator(item_code, defect_type):
    # ฟังก์ชันจำลองการตรวจสอบเงื่อนไข
    if not item_code.startswith("ITEM"):
        return "Invalid Item Code format."
    return f"Validated successfully for {defect_type} rework process."

demo = gr.Interface(
    fn=rework_validator,
    inputs=[gr.Textbox(label="Item Code"), gr.Dropdown(["Scratch", "Dent", "Packaging"], label="Defect Type")],
    outputs=gr.Textbox(label="Validation Result")
)

# เปิดรันเซิร์ฟเวอร์
demo.launch()
```

### การทำ Layout แบบซับซ้อนด้วย Blocks (`gr.Blocks`)
```python
import gradio as gr

with gr.Blocks(title="QSMS AI Console") as demo:
    gr.Markdown("# QSMS AI Management Console")
    
    with gr.Row():
        with gr.Column():
            input_box = gr.Textbox(placeholder="Enter search queries...", label="Search Query")
            submit_btn = gr.Button("Query Knowledge Base", variant="primary")
        with gr.Column():
            output_box = gr.JSON(label="Knowledge Retrieval Results")
            
    # กำหนด Event Listener
    submit_btn.click(fn=lambda x: {"status": "ok", "query": x}, inputs=input_box, outputs=output_box)

demo.launch(share=False)
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (ความเข้าใจในการจัดทำ Demo ระบบ AI)
