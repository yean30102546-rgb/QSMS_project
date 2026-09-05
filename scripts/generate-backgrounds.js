import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sapho\\.gemini\\antigravity-ide\\brain\\3cc57e1f-f4bb-4d73-85e3-aeadb327ca75';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/img');

// Concept 1: High-Contrast Dynamic Mesh & Precision Rework Orbit
const htmlConcept1 = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    background: #060913;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    position: relative;
  }

  /* Deep Space Ambient Glows */
  .glow-sfc {
    position: absolute;
    width: 900px;
    height: 900px;
    top: -200px;
    left: -150px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.08) 45%, rgba(6, 9, 19, 0) 70%);
    filter: blur(80px);
    pointer-events: none;
  }

  .glow-qsms {
    position: absolute;
    width: 1000px;
    height: 1000px;
    top: -250px;
    right: -100px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.32) 0%, rgba(6, 182, 212, 0.12) 45%, rgba(6, 9, 19, 0) 70%);
    filter: blur(90px);
    pointer-events: none;
  }

  .glow-center {
    position: absolute;
    width: 800px;
    height: 600px;
    bottom: -150px;
    left: 560px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(6, 9, 19, 0) 70%);
    filter: blur(100px);
    pointer-events: none;
  }

  /* Precision Engineering Grid */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 90% 70% at 50% 40%, black 40%, transparent 85%);
  }

  /* Micro Dot Lattice */
  .dot-matrix {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
    background-size: 30px 30px;
    opacity: 0.25;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%);
  }

  /* Rework Vector Light Paths */
  svg.vector-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Modern Swiss UI Typography Overlays */
  .header-tag {
    position: absolute;
    top: 70px;
    left: 90px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pill {
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #38BDF8;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 12px #10B981;
  }

  .sys-text {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 2px;
    color: rgba(148, 163, 184, 0.6);
  }

  .center-headline {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .title-sub {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 10px;
    text-transform: uppercase;
    background: linear-gradient(90deg, #F59E0B, #10B981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 14px;
    display: block;
  }

  .title-main {
    font-size: 76px;
    font-weight: 900;
    letter-spacing: -1.5px;
    color: #FFFFFF;
    line-height: 1.05;
    text-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  }

  .title-main span {
    background: linear-gradient(135deg, #FFFFFF 30%, #94A3B8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .title-caption {
    margin-top: 18px;
    font-size: 20px;
    font-weight: 400;
    color: #94A3B8;
    letter-spacing: 1px;
  }

  /* Metric Tickers Bottom */
  .bottom-bar {
    position: absolute;
    bottom: 60px;
    left: 90px;
    right: 90px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 24px;
  }

  .metric-group {
    display: flex;
    gap: 48px;
  }

  .metric-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .metric-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .metric-val {
    font-size: 18px;
    font-weight: 700;
    color: #F8FAFC;
    letter-spacing: 0.5px;
  }

  .metric-val.amber { color: #F59E0B; }
  .metric-val.green { color: #10B981; }
  .metric-val.blue { color: #38BDF8; }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #94A3B8;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="glow-sfc"></div>
  <div class="glow-qsms"></div>
  <div class="glow-center"></div>

  <div class="grid-pattern"></div>
  <div class="dot-matrix"></div>

  <svg class="vector-layer" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="orbitGrad" x1="200" y1="200" x2="1700" y2="800" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.6"/>
        <stop offset="45%" stop-color="#10B981" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.5"/>
      </linearGradient>

      <linearGradient id="pulseLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#F59E0B" stop-opacity="0"/>
        <stop offset="50%" stop-color="#10B981" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Rework Orbital Ellipses -->
    <ellipse cx="960" cy="540" rx="720" ry="320" stroke="url(#orbitGrad)" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.45" transform="rotate(-8 960 540)"/>
    <ellipse cx="960" cy="540" rx="540" ry="240" stroke="url(#orbitGrad)" stroke-width="2" opacity="0.6" transform="rotate(-8 960 540)"/>

    <!-- Orbital Nodes (representing inspection gates) -->
    <circle cx="430" cy="460" r="6" fill="#F59E0B" filter="drop-shadow(0 0 10px #F59E0B)"/>
    <circle cx="1490" cy="620" r="6" fill="#10B981" filter="drop-shadow(0 0 10px #10B981)"/>
    <circle cx="960" cy="300" r="8" fill="#38BDF8" filter="drop-shadow(0 0 12px #38BDF8)"/>

    <!-- Dynamic Flow Waves -->
    <path d="M 150 900 C 500 850, 700 650, 960 650 C 1220 650, 1420 450, 1770 400" stroke="url(#pulseLine)" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
    <path d="M 200 920 C 550 870, 750 670, 960 670 C 1170 670, 1370 470, 1720 420" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-linecap="round"/>
  </svg>

  <div class="header-tag">
    <div class="pill">
      <div class="pill-dot"></div>
      QSMS REWORK HUB
    </div>
    <div class="sys-text">SHOP FLOOR CONTROL · OPERATIONAL MATRIX</div>
  </div>

  <div class="center-headline">
    <span class="title-sub">ENGINEERING QUALITY GATE</span>
    <h1 class="title-main"><span>PRECISION REWORK</span></h1>
    <p class="title-caption">Automated Verification, Material Requisition & Shop Floor Handshake</p>
  </div>

  <div class="bottom-bar">
    <div class="metric-group">
      <div class="metric-item">
        <span class="metric-label">Authority</span>
        <span class="metric-val green">QSMS CORE</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Execution Unit</span>
        <span class="metric-val amber">SFC SHOP FLOOR</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Quality Gate</span>
        <span class="metric-val blue">100% INSPECTED</span>
      </div>
    </div>
    <div class="status-indicator">
      <div class="pill-dot"></div>
      ACTIVE REWORK LIFECYCLE
    </div>
  </div>
</body>
</html>
`;

// Concept 2: Minimalist Atmospheric Cover (Designed specifically for LINE OA Cover Header - 1080 x 875)
// Leaves lower center completely clean for the round avatar to dock smoothly!
const htmlConcept2LineCover = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 875px;
    background: #070B16;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    position: relative;
  }

  /* Dramatic Contrast Ambient Lights */
  .light-amber {
    position: absolute;
    width: 650px;
    height: 650px;
    top: -150px;
    left: -120px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.12) 45%, rgba(7, 11, 22, 0) 70%);
    filter: blur(75px);
  }

  .light-emerald {
    position: absolute;
    width: 750px;
    height: 750px;
    top: -180px;
    right: -100px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.38) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(7, 11, 22, 0) 70%);
    filter: blur(80px);
  }

  /* Technical Grid */
  .grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.1) 90%);
  }

  svg.arcs {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Top Branding Header */
  .top-meta {
    position: absolute;
    top: 50px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 8px 20px;
    border-radius: 999px;
    backdrop-filter: blur(16px);
  }

  .brand-title {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 3px;
    color: #F8FAFC;
    text-transform: uppercase;
  }

  .brand-sub {
    font-size: 12px;
    font-weight: 600;
    color: #10B981;
    letter-spacing: 1.5px;
  }

  .live-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #94A3B8;
    text-transform: uppercase;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 12px #10B981;
  }

  /* Center Visual Focus - Perfectly elevated above avatar area */
  .hero-block {
    position: absolute;
    top: 260px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    width: 900px;
  }

  .tagline {
    display: inline-block;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: #F59E0B;
    margin-bottom: 12px;
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
  }

  .headline {
    font-size: 58px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #FFFFFF;
    line-height: 1.1;
    margin-bottom: 16px;
    text-shadow: 0 8px 30px rgba(0, 0, 0, 0.9);
  }

  .headline-gradient {
    background: linear-gradient(135deg, #FFFFFF 20%, #38BDF8 60%, #10B981 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .desc {
    font-size: 18px;
    font-weight: 400;
    color: #94A3B8;
    letter-spacing: 0.5px;
  }

  /* Subtle Bottom Guide Hint (where avatar will rest) */
  .avatar-dock-glow {
    position: absolute;
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    height: 200px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(7, 11, 22, 0) 70%);
    filter: blur(40px);
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="light-amber"></div>
  <div class="light-emerald"></div>
  <div class="grid"></div>

  <svg class="arcs" viewBox="0 0 1080 875" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lineGrad" x1="0" y1="200" x2="1080" y2="600" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#10B981" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.6"/>
      </linearGradient>
    </defs>

    <!-- Flowing Rework Quality Arcs -->
    <path d="M -50 480 Q 280 200, 540 380 T 1130 320" stroke="url(#lineGrad)" stroke-width="2.5" stroke-dasharray="6 8" opacity="0.5"/>
    <path d="M -50 520 Q 280 240, 540 420 T 1130 360" stroke="url(#lineGrad)" stroke-width="3" opacity="0.8"/>
    <circle cx="540" cy="420" r="5" fill="#10B981" filter="drop-shadow(0 0 10px #10B981)"/>
    <circle cx="280" cy="240" r="4" fill="#F59E0B" filter="drop-shadow(0 0 8px #F59E0B)"/>
  </svg>

  <div class="top-meta">
    <div class="brand-badge">
      <span class="brand-title">QSMS × SFC</span>
      <span style="color: rgba(255,255,255,0.2);">|</span>
      <span class="brand-sub">REWORK SYSTEM</span>
    </div>
    <div class="live-tag">
      <div class="pulse-dot"></div>
      SHOP FLOOR CONTROL
    </div>
  </div>

  <div class="hero-block">
    <div class="tagline">Quality Assurance · Continuous Flow</div>
    <h1 class="headline">REWORK <span class="headline-gradient">EXCELLENCE</span></h1>
    <p class="desc">ระบบบันทึก ตรวจสอบ และติดตามงานแก้ไขชิ้นงานแบบเรียลไทม์</p>
  </div>

  <div class="avatar-dock-glow"></div>
</body>
</html>
`;

async function run() {
  console.log('Launching headless browser to render backgrounds...');
  const browser = await chromium.launch();

  // 1. Render Desktop / Wallpaper (1920 x 1080)
  const page1 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page1.setContent(htmlConcept1);
  await page1.waitForTimeout(500);

  const out1Public = path.join(PUBLIC_DIR, 'qsms-bg-wallpaper.png');
  const out1Artifact = path.join(ARTIFACT_DIR, 'qsms_bg_wallpaper_1788527000000.png');
  await page1.screenshot({ path: out1Public });
  await page1.screenshot({ path: out1Artifact });
  console.log(`Rendered Concept 1 Wallpaper to ${out1Public} and artifact!`);
  await page1.close();

  // 2. Render LINE OA Profile Cover (1080 x 875 - LINE Official Standard)
  const page2 = await browser.newPage({ viewport: { width: 1080, height: 875 } });
  await page2.setContent(htmlConcept2LineCover);
  await page2.waitForTimeout(500);

  const out2Public = path.join(PUBLIC_DIR, 'qsms-line-cover.png');
  const out2Artifact = path.join(ARTIFACT_DIR, 'qsms_line_cover_1788527000000.png');
  await page2.screenshot({ path: out2Public });
  await page2.screenshot({ path: out2Artifact });
  console.log(`Rendered Concept 2 LINE OA Cover to ${out2Public} and artifact!`);
  await page2.close();

  await browser.close();
  console.log('Finished rendering all backgrounds.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
