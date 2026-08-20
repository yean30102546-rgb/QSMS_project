const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

async function test() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Find a PDF in the workspaces
  const testPdfPath = path.join(__dirname, '../testsprite_tests/mock_data/test.pdf');
  if (!fs.existsSync(testPdfPath)) {
    console.log("Mock PDF not found at testsprite_tests/mock_data/test.pdf");
    return;
  }
  
  console.log("Reading test PDF...");
  const pdfBuffer = fs.readFileSync(testPdfPath);
  
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true
  });
  
  const pdf = await loadingTask.promise;
  console.log("PDF Pages:", pdf.numPages);
  
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  console.log(`Viewport dimensions: ${viewport.width}x${viewport.height}`);
  
  const nodeCanvas = canvas.createCanvas(viewport.width, viewport.height);
  const context = nodeCanvas.getContext('2d');
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  const imgBuffer = nodeCanvas.toBuffer('image/jpeg');
  console.log("Image rendered successfully, buffer size:", imgBuffer.length);
  fs.writeFileSync(path.join(__dirname, 'test-rendered.jpg'), imgBuffer);
  console.log("Wrote test-rendered.jpg");
}

test().catch(err => console.error("Error rendering PDF:", err));
