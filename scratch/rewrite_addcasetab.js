import * as fs from 'fs';

const fileContent = fs.readFileSync('src/components/tabs/AddCaseTab.tsx', 'utf-8');

// I will just use regex or ast to refactor it.
// Actually, writing a 900 line file with react-hook-form by hand might be better done by writing the new file directly.
