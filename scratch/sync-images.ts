import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const gasUrl = process.env.GAS_WEB_APP_URL!;

async function main() {
  console.log('Starting sync-images script...');
  console.log(`GAS Web App URL: ${gasUrl}`);
  console.log(`Supabase URL: ${supabaseUrl}`);

  if (!gasUrl) {
    throw new Error('GAS_WEB_APP_URL is not configured.');
  }

  // 1. Authenticate with GAS to get token
  console.log('Logging into GAS backend...');
  const loginRes = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'loginWithPassword',
      profile: 'QSMS',
      password: 'Qsms123'
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with HTTP status ${loginRes.status}`);
  }

  const loginResult = await loginRes.json();
  if (!loginResult.success) {
    throw new Error(`GAS login failed: ${loginResult.error}`);
  }

  const token = loginResult.data.token;
  const email = loginResult.data.user.email;
  const profile = loginResult.data.user.profile || 'QSMS';
  console.log(`✓ Logged in as ${profile} (${email})`);

  // 2. Fetch all cases from GAS
  console.log('Fetching all cases from Google Sheets via GAS...');
  const readAllRes = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'readAll',
      token,
      authProfile: profile,
      authEmail: email
    })
  });

  if (!readAllRes.ok) {
    throw new Error(`Failed to fetch cases: HTTP status ${readAllRes.status}`);
  }

  const readAllResult = await readAllRes.json();
  if (!readAllResult.success) {
    throw new Error(`Failed to read cases from GAS: ${readAllResult.error}`);
  }

  const gasCases = readAllResult.data || [];
  console.log(`✓ Retrieved ${gasCases.length} cases from GAS.`);

  // 3. Fetch all items from Supabase
  console.log('Fetching all rework items from Supabase...');
  const { data: dbItems, error: dbError } = await supabase
    .from('rework_items')
    .select('*');

  if (dbError) {
    throw new Error(`Failed to fetch items from Supabase: ${dbError.message}`);
  }

  console.log(`✓ Retrieved ${dbItems.length} rework items from Supabase.`);

  // Group DB items by case_id for faster lookups
  const dbItemsByCase: Record<string, typeof dbItems> = {};
  for (const item of dbItems) {
    if (!dbItemsByCase[item.case_id]) {
      dbItemsByCase[item.case_id] = [];
    }
    dbItemsByCase[item.case_id].push(item);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  // 4. Match and Sync
  for (const gasCase of gasCases) {
    const caseId = gasCase.id;
    const gasItems = gasCase.items || [];
    const dbCaseItems = dbItemsByCase[caseId] || [];

    if (dbCaseItems.length === 0) {
      console.log(`⚠️ Case ${caseId} from GAS not found in Supabase. Skipping.`);
      continue;
    }

    console.log(`Processing Case ${caseId}: ${gasItems.length} items from GAS, ${dbCaseItems.length} items in DB`);

    // We will keep track of matched DB item IDs to prevent matching the same DB item twice
    const matchedDbItemIds = new Set<string>();

    for (const gasItem of gasItems) {
      const imageUrls = gasItem.imageUrls || [];
      const imageFolderUrl = gasItem.imageFolderUrl || null;

      // Find best match in dbCaseItems
      let bestMatch: any = null;

      // Match strategy 1: By UID if both have it
      if (gasItem.uid) {
        bestMatch = dbCaseItems.find(item => item.uid === gasItem.uid && !matchedDbItemIds.has(item.id));
      }

      // Match strategy 2: By Item ID (if gasItem.id matches item.uid or item.id)
      if (!bestMatch && gasItem.id) {
        bestMatch = dbCaseItems.find(item => (item.uid === gasItem.id || item.id === gasItem.id) && !matchedDbItemIds.has(item.id));
      }

      // Match strategy 3: By Item Number + item properties
      if (!bestMatch) {
        bestMatch = dbCaseItems.find(item => 
          item.item_number === gasItem.itemNumber && 
          item.amount === gasItem.amount &&
          item.reason === gasItem.reason &&
          !matchedDbItemIds.has(item.id)
        );
      }

      // Match strategy 4: By Item Number only
      if (!bestMatch) {
        bestMatch = dbCaseItems.find(item => 
          item.item_number === gasItem.itemNumber && 
          !matchedDbItemIds.has(item.id)
        );
      }

      if (bestMatch) {
        matchedDbItemIds.add(bestMatch.id);

        // Check if values actually changed to avoid redundant writes
        const dbUrls = bestMatch.image_urls || [];
        const dbFolder = bestMatch.image_folder_url || null;

        const urlsMatch = JSON.stringify(dbUrls) === JSON.stringify(imageUrls);
        const folderMatch = dbFolder === imageFolderUrl;

        if (urlsMatch && folderMatch) {
          skippedCount++;
          continue;
        }

        console.log(`  Updating item ${bestMatch.id} (${bestMatch.item_number}):`);
        console.log(`    imageUrls: ${JSON.stringify(dbUrls)} -> ${JSON.stringify(imageUrls)}`);
        console.log(`    imageFolderUrl: ${dbFolder} -> ${imageFolderUrl}`);

        const { error: updateError } = await supabase
          .from('rework_items')
          .update({
            image_urls: imageUrls,
            image_folder_url: imageFolderUrl
          })
          .eq('id', bestMatch.id);

        if (updateError) {
          console.error(`  ❌ Failed to update item ${bestMatch.id}:`, updateError.message);
        } else {
          updatedCount++;
        }
      } else {
        console.log(`  ❌ Could not match GAS item ${gasItem.id || gasItem.itemNumber} in case ${caseId} with any DB item.`);
      }
    }
  }

  console.log(`\nSync completed!`);
  console.log(`Total updated items: ${updatedCount}`);
  console.log(`Total skipped items (already up to date): ${skippedCount}`);
}

main().catch(console.error);
