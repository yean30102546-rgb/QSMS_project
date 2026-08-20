import fs from 'fs';

async function test() {
  const pdfParseModule = await import('pdf-parse');
  console.log("Keys:", Object.keys(pdfParseModule));
  console.log("default type:", typeof pdfParseModule.default);
}

test();
