CREATE TABLE IF NOT EXISTS public.engineering_drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drawing_number TEXT NOT NULL,
    revision TEXT NOT NULL,
    part_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    item_code TEXT, -- ลิงก์กับรหัสสินค้าใน Item Master
    r2_key TEXT NOT NULL, -- คีย์อ้างอิงไฟล์ใน Cloudflare R2 (e.g. drawings/...)
    file_name TEXT NOT NULL, -- ชื่อไฟล์ที่จัดระเบียบตามแพทเทิร์นแล้ว
    type TEXT NOT NULL CHECK (type IN ('drawing', 'master')), -- drawing=ลูกค้า, master=เราเอง
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT
);

-- สร้าง Index เพื่อความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_eng_drawings_no_type ON public.engineering_drawings(drawing_number, type, is_active);
CREATE INDEX IF NOT EXISTS idx_eng_drawings_item_code ON public.engineering_drawings(item_code);

-- เปิดใช้งาน RLS (Row Level Security)
ALTER TABLE public.engineering_drawings ENABLE ROW LEVEL SECURITY;

-- นโยบายการเข้าถึงข้อมูล (สิทธิ์อ่านทุกคนที่มีสิทธิ์ Platform, สิทธิ์เขียน Admin/Operator)
CREATE POLICY "Allow read engineering_drawings" ON public.engineering_drawings
    FOR SELECT USING (true);

CREATE POLICY "Allow all actions for authenticated users" ON public.engineering_drawings
    FOR ALL USING (true);
