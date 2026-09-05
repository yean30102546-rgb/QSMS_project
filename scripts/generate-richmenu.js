import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sapho\\.gemini\\antigravity-ide\\brain\\3cc57e1f-f4bb-4d73-85e3-aeadb327ca75';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/img');

// Rich Menu 6 Slots (2500 x 1686 px) - LINE Official Account Standard
const htmlRichMenu = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2500px;
    height: 1686px;
    background: #070B16;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    overflow: hidden;
    position: relative;
  }

  /* Global Ambient Backlight */
  .ambient-top-left {
    position: absolute;
    width: 1200px;
    height: 900px;
    top: -200px;
    left: -200px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  .ambient-bottom-right {
    position: absolute;
    width: 1400px;
    height: 1000px;
    bottom: -200px;
    right: -200px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  /* Grid Cell Card */
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 40px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(7, 11, 22, 0.8) 100%);
    z-index: 2;
    overflow: hidden;
  }

  /* Specific accents for cells */
  .cell-1 { border-top: none; border-left: none; }
  .cell-2 { border-top: none; }
  .cell-3 { border-top: none; border-right: none; }
  .cell-4 { border-bottom: none; border-left: none; }
  .cell-5 { border-bottom: none; }
  .cell-6 { border-bottom: none; border-right: none; }

  /* Top Border Accents */
  .cell::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    opacity: 0.6;
  }

  .accent-amber::before {
    background: linear-gradient(90deg, transparent, #F59E0B, transparent);
  }
  .accent-emerald::before {
    background: linear-gradient(90deg, transparent, #10B981, transparent);
  }
  .accent-blue::before {
    background: linear-gradient(90deg, transparent, #38BDF8, transparent);
  }
  .accent-purple::before {
    background: linear-gradient(90deg, transparent, #A855F7, transparent);
  }

  /* Icon Container */
  .icon-wrapper {
    width: 170px;
    height: 170px;
    border-radius: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 34px;
    position: relative;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }

  .icon-wrapper svg {
    width: 86px;
    height: 86px;
  }

  /* Color Schemes */
  .theme-amber .icon-wrapper {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.08) 100%);
    border: 2px solid rgba(245, 158, 11, 0.5);
    color: #FBBF24;
  }

  .theme-emerald .icon-wrapper {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.08) 100%);
    border: 2px solid rgba(16, 185, 129, 0.5);
    color: #34D399;
  }

  .theme-blue .icon-wrapper {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.08) 100%);
    border: 2px solid rgba(56, 189, 248, 0.5);
    color: #38BDF8;
  }

  .theme-rose .icon-wrapper {
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.08) 100%);
    border: 2px solid rgba(244, 63, 94, 0.5);
    color: #FB7185;
  }

  .theme-purple .icon-wrapper {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.08) 100%);
    border: 2px solid rgba(168, 85, 247, 0.5);
    color: #C084FC;
  }

  .theme-cyan .icon-wrapper {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.08) 100%);
    border: 2px solid rgba(6, 182, 212, 0.5);
    color: #22D3EE;
  }

  /* Badge indicator */
  .cell-badge {
    position: absolute;
    top: 45px;
    right: 50px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 6px 18px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .badge-amber {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #F59E0B;
  }

  .badge-emerald {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10B981;
  }

  .badge-blue {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38BDF8;
  }

  /* Typography */
  .title-th {
    font-size: 46px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.25;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
  }

  .subtitle-en {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #94A3B8;
    margin-bottom: 16px;
  }

  .desc-th {
    font-size: 21px;
    font-weight: 500;
    color: #64748B;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="ambient-top-left"></div>
  <div class="ambient-bottom-right"></div>

  <!-- SLOT 1: เปิดเคส Rework -->
  <div class="cell cell-1 theme-amber accent-amber">
    <div class="cell-badge badge-amber">SFC & CS</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div class="title-th">เปิดเคส Rework</div>
    <div class="subtitle-en">Create Case</div>
    <div class="desc-th">เปิดงานเคลม RT (ลูกค้า) / RW (SFC)</div>
  </div>

  <!-- SLOT 2: ติดตามสถานะงาน -->
  <div class="cell cell-2 theme-emerald accent-emerald">
    <div class="cell-badge badge-emerald">Real-time</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    </div>
    <div class="title-th">ติดตามสถานะงาน</div>
    <div class="subtitle-en">Live Progress</div>
    <div class="desc-th">เช็ก % ยอดกล่องผลิตเสร็จ & แผนกรับผิดชอบ</div>
  </div>

  <!-- SLOT 3: แจ้งวัสดุขาด (WPK) -->
  <div class="cell cell-3 theme-rose accent-amber">
    <div class="cell-badge badge-amber">WPK Alert</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <div class="title-th">แจ้งวัสดุขาด</div>
    <div class="subtitle-en">Shortage Report</div>
    <div class="desc-th">รายงานขาดกล่อง · แกลลอน · น้ำมัน</div>
  </div>

  <!-- SLOT 4: ค้นหา Drawing & Master -->
  <div class="cell cell-4 theme-blue accent-blue">
    <div class="cell-badge badge-blue">Engineering</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    </div>
    <div class="title-th">ค้นหา Drawing</div>
    <div class="subtitle-en">Master Spec</div>
    <div class="desc-th">สืบค้นแบบแปลน PDF & ข้อมูล Item Master</div>
  </div>

  <!-- SLOT 5: ถาม AI คู่มือซ่อม (DocAI) -->
  <div class="cell cell-5 theme-purple accent-purple">
    <div class="cell-badge badge-emerald">AI Assistant</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>
      </svg>
    </div>
    <div class="title-th">ถาม AI คู่มือซ่อม</div>
    <div class="subtitle-en">DocAI RAG</div>
    <div class="desc-th">สืบค้นวิธีแก้ปัญหารั่ว/เปื้อน & สถิติย้อนหลัง</div>
  </div>

  <!-- SLOT 6: แดชบอร์ดสรุปยอด -->
  <div class="cell cell-6 theme-cyan accent-blue">
    <div class="cell-badge badge-blue">Analytics</div>
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    </div>
    <div class="title-th">แดชบอร์ดสรุปยอด</div>
    <div class="subtitle-en">Metrics & Export</div>
    <div class="desc-th">ภาพรวมสถิติ Rework & ดาวน์โหลด Excel</div>
  </div>
</body>
</html>
`;

async function run() {
  console.log('Rendering 2500x1686 Rich Menu...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2500, height: 1686 } });
  await page.setContent(htmlRichMenu);
  await page.waitForTimeout(600);

  const outPublic = path.join(PUBLIC_DIR, 'qsms-richmenu-6slots.png');
  const outArtifact = path.join(ARTIFACT_DIR, 'qsms_richmenu_6slots_1788527500000.png');

  await page.screenshot({ path: outPublic });
  await page.screenshot({ path: outArtifact });

  console.log(`Rendered Rich Menu image to ${outPublic} and ${outArtifact}!`);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
