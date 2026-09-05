import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { promisify } from 'util';
import { supabaseServer } from '../../../lib/supabaseServer';
import { assertPermission, AuthError, generateToken, requireServerAuth } from '../../../lib/serverAuth';
import { generateCaseId } from '../../../utils/helpers';

const scryptAsync = promisify(crypto.scrypt);

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface DBItem {
  id: string;
  item_number: string;
  item_code: string;
  item_name: string;
  amount?: number | string;
  reason?: string;
  reason_subtype?: string;
  responsible?: string;
  responsible_subtype?: string;
  details?: string;
  line?: string;
  image_urls?: string[];
  image_folder_url?: string;
  customer_name?: string;
  batch_no?: string;
  packaging_date?: string;
  mold?: string;
  uid?: string;
  completed_boxes?: number;
}

interface FrontendItem {
  id: string;
  itemNumber: string;
  itemName: string;
  itemCode: string;
  amount: number | string;
  reason: string;
  reasonSubtype?: string;
  responsible: string;
  responsibleSubtype?: string;
  details?: string;
  line?: string;
  imageUrls?: string[];
  imageFolderUrl?: string;
  customerName?: string;
  batchNo?: string;
  packagingDate?: string;
  mold?: string;
  uid?: string;
  images?: string[];
}

interface MasterItem {
  id: string;
  item_name?: string;
  item_code?: string;
  item_number?: string;
}




interface DBCase {
  id: string;
  case_name?: string;
  case_sequence?: number;
  submission_date: string;
  created_at: string;
  source: string;
  customer_name?: string;
  status: string;
  profile_id: string;
  created_by_role?: string;
  created_by_name?: string;
  image_folder_url?: string;
  or_folder_url?: string;
  or_files_urls?: string[];
  batch_no?: string;
  packaging_date?: string;
  mold?: string;
  resolution_method?: string;
  material_requests?: unknown[];
  blocked_info?: Record<string, unknown>;
  missing_boxes?: number;
  missing_gallons?: number;
  missing_oil?: number;
  items?: DBItem[];
}

const getBangkokParts = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  return Object.fromEntries(parts.map(p => [p.type, p.value]));
};

const getBangkokISOString = () => {
  const parts = getBangkokParts();
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}+07:00`;
};

const getBangkokDateString = () => {
  const parts = getBangkokParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
};

async function uploadBase64Image(base64Data: string, prefix: string): Promise<string> {
  const base64Clean = typeof base64Data === 'string' ? base64Data.replace(/^data:image\/\w+;base64,/, '') : base64Data;
  const buffer = Buffer.from(base64Clean, 'base64');
  const uniqueFileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

  const { error } = await supabaseServer
    .storage
    .from('rework_images')
    .upload(uniqueFileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseServer
    .storage
    .from('rework_images')
    .getPublicUrl(uniqueFileName);

  return publicUrlData.publicUrl;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const requiresAuth = action !== 'loginWithPassword' && action !== 'fetchPublicOverview';
    const auth = requiresAuth ? await requireServerAuth(body) : null;

    console.log(`[Rework API] Action: ${action}`, { bodyKeys: Object.keys(body) });

    switch (action) {
      case 'fetchPublicOverview': {
        const todayKey = getBangkokDateString();
        const currentMonthKey = todayKey.substring(0, 7);

        // Fetch data in parallel
        const [casesRes, empRes, todayLeavesRes, monthLeavesRes] = await Promise.all([
          supabaseServer
            .from('rework_cases')
            .select('status')
            .eq('is_deleted', false),
          supabaseServer
            .from('roster_employees')
            .select('id'),
          supabaseServer
            .from('roster_leaves')
            .select('leave_type')
            .eq('date_key', todayKey),
          supabaseServer
            .from('roster_leaves')
            .select('id')
            .like('date_key', `${currentMonthKey}-%`)
        ]);

        if (casesRes.error) throw casesRes.error;
        if (empRes.error) throw empRes.error;
        if (todayLeavesRes.error) throw todayLeavesRes.error;
        if (monthLeavesRes.error) throw monthLeavesRes.error;

        // 1. Rework calculations
        let pending = 0;
        let inProgress = 0;
        let completed = 0;

        (casesRes.data || []).forEach((c: { status: string }) => {
          if (c.status === 'Pending') pending++;
          else if (c.status === 'In-Progress') inProgress++;
          else if (c.status === 'Completed') completed++;
        });

        const totalCases = pending + inProgress + completed;
        const completionRate = totalCases > 0 ? parseFloat(((completed / totalCases) * 100).toFixed(1)) : 0;

        // 2. Roster calculations
        const totalEmployees = empRes.data.length;
        const onLeaveCount = todayLeavesRes.data.length;
        const staffPresentCount = Math.max(0, totalEmployees - onLeaveCount);

        const leaveSummary = { sick: 0, business: 0, vacation: 0 };
        todayLeavesRes.data.forEach((l: { leave_type: string | null }) => {
          const type = (l.leave_type || '').toLowerCase();
          if (type.includes('sick') || type.includes('ป่วย')) leaveSummary.sick++;
          else if (type.includes('business') || type.includes('กิจ')) leaveSummary.business++;
          else leaveSummary.vacation++;
        });

        const workDays = 22;
        const totalPossibleManDays = totalEmployees * workDays;
        let retentionRate = 100;
        if (totalPossibleManDays > 0) {
          const totalLeavesInMonth = monthLeavesRes.data.length;
          const attendance = ((totalPossibleManDays - totalLeavesInMonth) / totalPossibleManDays) * 100;
          retentionRate = parseFloat(Math.min(100, Math.max(0, attendance)).toFixed(1));
        }

        return NextResponse.json(
          {
            success: true,
            data: {
              rework: {
                total: totalCases,
                pending,
                inProgress,
                completed,
                completionRate
              },
              roster: {
                totalEmployees,
                staffPresentCount,
                onLeaveCount,
                leaveSummary,
                retentionRate
              }
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'fetchAllCases': {
        const { data, error } = await supabaseServer
          .from('rework_cases')
          .select(`
            *,
            items:rework_items(*)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Rework API] Supabase fetch error:', error);
          throw error;
        }

        const cases = data.map((c: DBCase) => ({
          id: c.id,
          caseName: c.case_name || c.id,
          caseSequence: c.case_sequence,
          date: c.submission_date,
          timestamp: c.created_at,
          source: c.source,
          customerName: c.customer_name,
          status: c.status,
          profileId: c.profile_id,
          createdByRole: c.created_by_role,
          createdByName: c.created_by_name,
          imageFolderUrl: c.image_folder_url,
          orFolderUrl: c.or_folder_url,
          orFilesUrls: c.or_files_urls || [],
          batchNo: c.batch_no,
          packagingDate: c.packaging_date,
          mold: c.mold,
          resolutionMethod: c.resolution_method,
          materialRequests: c.material_requests || [],
          blockedInfo: c.blocked_info || {},
          missingBoxes: c.missing_boxes,
          missingGallons: c.missing_gallons,
          missingOil: c.missing_oil,
          items: (c.items || []).map((i: DBItem) => ({
            id: i.id,
            itemNumber: i.item_number,
            itemCode: i.item_code,
            itemName: i.item_name,
            amount: parseFloat(String(i.amount || 0)),
            completedBoxes: parseFloat(String(i.completed_boxes || 0)),
            reason: i.reason,
            reasonSubtype: i.reason_subtype,
            responsible: i.responsible,
            responsibleSubtype: i.responsible_subtype,
            details: i.details,
            line: i.line,
            imageUrls: i.image_urls || [],
            imageFolderUrl: i.image_folder_url,
            customerName: i.customer_name,
            batchNo: i.batch_no,
            packagingDate: i.packaging_date,
            mold: i.mold,
            uid: i.uid
          }))
        }));

        return NextResponse.json(
          { success: true, data: cases },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'insertCase': {
        if (!auth) throw new AuthError('Authentication required');
        assertPermission(auth, 'create_case');
        const { caseData } = body;
        const isFastTrack = !!caseData?.isFastTrack;

        console.log('[Rework API] Inserting Case Data:', {
          id: caseData?.id,
          itemCount: caseData?.items?.length,
          hasOrFiles: !!caseData?.orFiles?.length,
          isFastTrack
        });

        if (caseData?.items && Array.isArray(caseData.items)) {
          for (const i of caseData.items) {
            if (!i.amount || i.amount <= 0) {
              return NextResponse.json({ success: false, error: `Item amount must be greater than 0 for item: ${i.itemNumber || 'Unknown'}` }, { status: 400 });
            }
          }
        }

        // Validate mandatory attachments for Customer / RT cases
        const primaryCustomer = String(caseData?.customerName || (caseData?.items && caseData.items[0]?.customerName) || '').trim();
        const isCustomerCase = caseData?.source === 'Customer' || (primaryCustomer !== '' && primaryCustomer !== 'SFC') || (caseData?.id && String(caseData.id).startsWith('RT'));
        const totalOrFiles = (caseData?.orFiles?.length || 0) + (caseData?.orFilesUrls?.length || 0);

        if (isCustomerCase && totalOrFiles === 0 && !isFastTrack) {
          return NextResponse.json(
            { success: false, error: 'งาน RT (เคสลูกค้า) จำเป็นต้องมีเอกสารหรือไฟล์อ้างอิงแนบอย่างน้อย 1 ไฟล์ก่อนเปิดเคส' },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Generate Case ID if missing or temporary
        let finalCaseId = caseData?.id;
        let caseSequence = caseData?.caseSequence || caseData?.case_sequence;
        const isTemporaryId = !finalCaseId || String(finalCaseId).startsWith('temp-') || String(finalCaseId).length < 5;
        
        if (isTemporaryId) {
          const prefix = (caseData?.source === 'Customer' || (caseData?.customerName && caseData.customerName !== 'SFC')) ? 'RT' : 'RW';
          const bkkParts = getBangkokParts();
          const currentYear = bkkParts.year;

          try {
            const { data: seqData, error: seqErr } = await supabaseServer
              .rpc('get_next_case_sequence', { p_prefix: prefix, p_year: currentYear });
            
            if (!seqErr && typeof seqData === 'number' && seqData > 0) {
              caseSequence = seqData;
            } else {
              const { count } = await supabaseServer
                .from('rework_cases')
                .select('id', { count: 'exact', head: true })
                .ilike('id', `${prefix}-${currentYear}-%`);
              caseSequence = (count || 0) + 1;
            }
          } catch {
            caseSequence = 1;
          }

          finalCaseId = generateCaseId(prefix, caseSequence, currentYear);
        }

        // 1. Upload OR Files
        const orFilesUrls: string[] = [];
        if (caseData.orFiles && caseData.orFiles.length > 0) {
          for (const base64 of caseData.orFiles) {
            const url = await uploadBase64Image(base64, `or-${finalCaseId}`);
            orFilesUrls.push(url);
          }
        }

        // 2. Insert Case with Graceful Schema Fallback
        const initialCasePayload: Record<string, unknown> = {
          id: finalCaseId,
          case_name: caseData.caseName || finalCaseId,
          case_sequence: caseSequence || 0,
          submission_date: caseData.date || getBangkokDateString(),
          source: caseData.source || ((primaryCustomer && primaryCustomer !== 'SFC') ? 'Customer' : 'SFC'),
          customer_name: primaryCustomer,
          status: caseData.status || 'Pending Analysis',
          profile_id: auth.profile,
          created_by_role: auth.profile,
          created_by_name: (body.performedBy || auth.email || '').trim(),
          image_folder_url: '',
          or_folder_url: '',
          or_files_urls: caseData.orFilesUrls || orFilesUrls,
          batch_no: caseData.batchNo,
          packaging_date: caseData.packagingDate,
          mold: caseData.mold,
          resolution_method: caseData.resolutionMethod,
          material_requests: caseData.materialRequests || caseData.material_requests || [],
          blocked_info: caseData.blockedInfo || caseData.blocked_info || {},
          created_at: getBangkokISOString(),
          updated_at: getBangkokISOString()
        };

        let { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([initialCasePayload]);

        if (caseError && typeof caseError.message === 'string' && caseError.message.includes('schema cache')) {
          console.warn('[Rework API] Schema cache missing column on insert, retrying without optional workflow columns:', caseError.message);
          const fallbackPayload = { ...initialCasePayload };
          delete fallbackPayload.case_sequence;
          delete fallbackPayload.material_requests;
          delete fallbackPayload.blocked_info;
          delete fallbackPayload.created_by_role;
          delete fallbackPayload.created_by_name;
          const retryRes = await supabaseServer.from('rework_cases').insert([fallbackPayload]);
          caseError = retryRes.error;
        }

        if (caseError) {
          console.error('[Rework API] Supabase case insert error:', caseError);
          throw caseError;
        }

        // 3. Upload Item Images and Insert Items
        if (caseData.items && caseData.items.length > 0) {
          const itemsToInsert = [];
          for (const i of caseData.items) {
            const itemImageUrls: string[] = [];
            if (i.images && i.images.length > 0) {
              for (const base64 of i.images) {
                const url = await uploadBase64Image(base64, `item-${i.itemNumber || 'unk'}`);
                itemImageUrls.push(url);
              }
            }
            itemsToInsert.push({
              case_id: finalCaseId,
              item_number: i.itemNumber,
              item_code: i.itemCode,
              item_name: i.itemName,
              amount: i.amount || 0,
              reason: i.reason,
              reason_subtype: i.reasonSubtype,
              responsible: i.responsible || (isFastTrack ? 'รอระบุ' : ''),
              responsible_subtype: i.responsibleSubtype || (isFastTrack ? 'รอระบุ' : ''),
              details: i.details,
              line: i.line,
              image_urls: [...(i.imageUrls || []), ...itemImageUrls],
              image_folder_url: '',
              customer_name: i.customerName || primaryCustomer,
              batch_no: i.batchNo || caseData.batchNo,
              packaging_date: i.packagingDate || caseData.packagingDate,
              mold: i.mold || caseData.mold,
              uid: i.uid || i.id,
              completed_boxes: i.completedBoxes || 0,
              created_at: getBangkokISOString()
            });
          }

          const { error: itemsError } = await supabaseServer
            .from('rework_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error('[Rework API] Supabase items insert error:', itemsError);
            throw itemsError;
          }
        }

        return NextResponse.json(
          { success: true, data: { caseId: finalCaseId } },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'updateCaseStatus': {
        if (!auth) throw new AuthError('Authentication required');
        assertPermission(auth, 'update_status');
        const { caseId, status, resolutionMethod, reworkCost, performedBy } = body;
        const updates = body.updates || {};
        const hasResolutionChange =
          resolutionMethod !== undefined ||
          updates.resolutionMethod !== undefined;

        if (hasResolutionChange) {
          assertPermission(auth, 'fill_resolution');
        }

        // Upload new OR files to Supabase Storage
        const newOrFilesUrls: string[] = [];
        if (body.orFiles && body.orFiles.length > 0) {
          for (const base64 of body.orFiles) {
            const url = await uploadBase64Image(base64, `or-${caseId}`);
            newOrFilesUrls.push(url);
          }
        }

        const { data: existingCase, error: existingCaseError } = await supabaseServer
          .from('rework_cases')
          .select('id, status, resolution_method, customer_name, source, or_files_urls, or_folder_url, case_name')
          .eq('id', caseId)
          .maybeSingle();

        if (existingCaseError) throw existingCaseError;
        if (!existingCase) throw new Error(`Case ${caseId} not found`);

        // 1. Delete items if deleteItemIds exists
        if (updates.deleteItemIds && updates.deleteItemIds.length > 0) {
          const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          const uuidIds = updates.deleteItemIds.filter(isUuid);
          const otherIds = updates.deleteItemIds.filter((id: string) => !isUuid(id));

          const actualCaseIdStr = existingCase.id;
          if (uuidIds.length > 0) {
            const { error: delError1 } = await supabaseServer.from('rework_items').delete().eq('case_id', actualCaseIdStr).in('id', uuidIds);
            if (delError1) console.error('Error deleting items by UUID:', delError1);
          }
          if (otherIds.length > 0) {
            const { error: delError2 } = await supabaseServer.from('rework_items').delete().eq('case_id', actualCaseIdStr).in('uid', otherIds);
            if (delError2) console.error('Error deleting items by UID:', delError2);
          }
        }

        // 2. Insert or update items
        if (updates.items && Array.isArray(updates.items)) {
          for (const item of updates.items) {
            if (!item.amount || item.amount <= 0) {
              return NextResponse.json({ success: false, error: `Item amount must be greater than 0 for item: ${item.itemNumber || 'Unknown'}` }, { status: 400 });
            }
            if (item.completedBoxes !== undefined && item.completedBoxes < 0) {
              return NextResponse.json({ success: false, error: `Completed boxes cannot be negative for item: ${item.itemNumber || 'Unknown'}` }, { status: 400 });
            }
          }

          const actualCaseIdStr = existingCase.id;

          const { data: existingDbItems } = await supabaseServer
            .from('rework_items')
            .select('id, uid')
            .eq('case_id', actualCaseIdStr);

          const existingUids = new Set(existingDbItems?.map(x => x.uid).filter(Boolean) || []);
          const existingIds = new Set(existingDbItems?.map(x => x.id).filter(Boolean) || []);

          try {
            require('fs').appendFileSync('scratch/api_debug.log', new Date().toISOString() + ' items payload: ' + JSON.stringify(updates.items) + '\n');
          } catch (e) {}

          for (const item of updates.items) {
            const itemData = {
              case_id: actualCaseIdStr,
              item_number: item.itemNumber,
              item_code: item.itemCode,
              item_name: item.itemName,
              amount: item.amount || 0,
              reason: item.reason,
              reason_subtype: item.reasonSubtype,
              responsible: item.responsible,
              responsible_subtype: item.responsibleSubtype,
              details: item.details,
              line: item.line,
              customer_name: item.customerName,
              batch_no: item.batchNo,
              packaging_date: item.packagingDate,
              mold: item.mold,
              uid: item.uid,
              completed_boxes: item.completedBoxes || 0,
              image_urls: item.imageUrls || [],
              image_folder_url: item.imageFolderUrl
            };

            if (item.id && existingIds.has(item.id)) {
              const { error: updErr } = await supabaseServer.from('rework_items').update(itemData).eq('id', item.id);
              if (updErr) throw new Error(`Failed to update item ${item.itemNumber}: ${updErr.message}`);
            } else if (item.uid && existingUids.has(item.uid)) {
              const { error: updUidErr } = await supabaseServer.from('rework_items').update(itemData).eq('uid', item.uid);
              if (updUidErr) throw new Error(`Failed to update item ${item.itemNumber}: ${updUidErr.message}`);
            } else {
              const { error: insErr } = await supabaseServer.from('rework_items').insert([{
                ...itemData,
                created_at: getBangkokISOString()
              }]);
              if (insErr) throw new Error(`Failed to insert item ${item.itemNumber}: ${insErr.message}`);
            }
          }
        }

        // 3. Update the case record
        const updatePayload: Record<string, unknown> = {
          status: status ?? updates.status ?? existingCase.status,
          resolution_method: resolutionMethod ?? updates.resolutionMethod ?? existingCase.resolution_method,
          customer_name: updates.customerName ?? existingCase.customer_name,
          source: updates.source ?? existingCase.source,
          case_name: updates.caseName ?? existingCase.case_name,
          or_files_urls: updates.orFilesUrls ? [...updates.orFilesUrls, ...newOrFilesUrls] : [...(existingCase.or_files_urls || []), ...newOrFilesUrls],
          or_folder_url: '',
          updated_at: getBangkokISOString()
        };

        if (updates.materialRequests !== undefined || updates.material_requests !== undefined) {
          updatePayload.material_requests = updates.materialRequests ?? updates.material_requests;
        }
        if (updates.blockedInfo !== undefined || updates.blocked_info !== undefined) {
          updatePayload.blocked_info = updates.blockedInfo ?? updates.blocked_info;
        }
        if (updates.missingBoxes !== undefined) updatePayload.missing_boxes = updates.missingBoxes;
        if (updates.missingGallons !== undefined) updatePayload.missing_gallons = updates.missingGallons;
        if (updates.missingOil !== undefined) updatePayload.missing_oil = updates.missingOil;

        let { error: caseUpdateError } = await supabaseServer
          .from('rework_cases')
          .update(updatePayload)
          .eq('id', caseId);

        // Graceful schema fallback if columns like material_requests or blocked_info are not yet present in Supabase table
        if (caseUpdateError && typeof caseUpdateError.message === 'string' && caseUpdateError.message.includes('schema cache')) {
          console.warn('[Rework API] Supabase schema cache missing column on update, retrying with core columns only:', caseUpdateError.message);
          const fallbackPayload = { ...updatePayload };
          delete fallbackPayload.material_requests;
          delete fallbackPayload.blocked_info;
          delete fallbackPayload.missing_boxes;
          delete fallbackPayload.missing_gallons;
          delete fallbackPayload.missing_oil;

          const retryRes = await supabaseServer
            .from('rework_cases')
            .update(fallbackPayload)
            .eq('id', caseId);
          caseUpdateError = retryRes.error;
        }

        if (caseUpdateError) throw caseUpdateError;

        // 4. Log the update
        await supabaseServer.from('rework_logs').insert([{
          case_id: caseId,
          action: `Status updated to ${status || updates.status}`,
          performed_by: performedBy || auth.profile || auth.email || 'System',
          timestamp: getBangkokISOString()
        }]);

        return NextResponse.json(
          {
            success: true,
            data: {
              caseId,
              status: status || updates.status,
              orFilesUrls: updates.orFilesUrls ? [...updates.orFilesUrls, ...newOrFilesUrls] : [...(existingCase.or_files_urls || []), ...newOrFilesUrls],
              orFolderUrl: ''
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'deleteCase': {
        if (!auth) throw new AuthError('Authentication required');
        assertPermission(auth, 'delete_case');
        const { caseId } = body;
        const { error } = await supabaseServer
          .from('rework_cases')
          .update({ is_deleted: true })
          .eq('id', caseId);

        if (error) throw error;
        return NextResponse.json(
          { success: true, data: { caseId } },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'verifyItem': {
        const cleanNumber = typeof body.itemNumber === 'string' ? body.itemNumber.trim() : '';
        const cleanCode = typeof body.itemCode === 'string' ? body.itemCode.trim() : '';

        const conditions: string[] = [];
        if (cleanNumber) {
          conditions.push(`item_number.eq.${cleanNumber}`);
          conditions.push(`item_number.ilike.${cleanNumber}`);
          conditions.push(`item_number.ilike.${cleanNumber}%`);
        }
        if (cleanCode) {
          conditions.push(`item_code.eq.${cleanCode}`);
          conditions.push(`item_code.ilike.${cleanCode}`);
          conditions.push(`item_code.ilike.${cleanCode}%`);
        }

        if (conditions.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        let { data, error } = await supabaseServer
          .from('rework_master_items')
          .select('*')
          .or(conditions.join(','))
          .limit(10);

        if (error) throw error;

        // Fallback: if no direct match, fetch master items and search in JS with trim()
        if (!data || data.length === 0) {
          const { data: allMaster } = await supabaseServer
            .from('rework_master_items')
            .select('*')
            .limit(1000);

          if (allMaster && allMaster.length > 0) {
            data = allMaster.filter(r => {
              const rNum = String(r.item_number || '').trim();
              const rCode = String(r.item_code || '').trim();
              return (cleanNumber && rNum === cleanNumber) || (cleanCode && rCode === cleanCode);
            });
          }
        }

        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Detect identity conflict: itemNumber matches one row, itemCode matches another
        if (cleanNumber && cleanCode && data.length > 1) {
          const matchByNumber = data.find(r => String(r.item_number || '').trim() === cleanNumber);
          const matchByCode = data.find(r => String(r.item_code || '').trim() === cleanCode);

          if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
            return NextResponse.json(
              { success: true, data: { found: true, conflict: true } },
              { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
        }

        const record = data[0];
        return NextResponse.json(
          {
            success: true,
            data: {
              found: true,
              id: record.id,
              itemName: String(record.item_name || '').trim(),
              itemCode: String(record.item_code || '').trim(),
              itemNumber: String(record.item_number || '').trim()
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'loadMasterData': {
        const [itemsRes, defectsRes] = await Promise.all([
          supabaseServer.from('rework_master_items').select('*'),
          supabaseServer.from('rework_master_defects').select('*')
        ]);

        if (itemsRes.error) {
          if (itemsRes.error.code === 'PGRST205') {
            console.warn('[Rework API] Table rework_master_items not found, defaulting to empty.');
            itemsRes.data = [];
            (itemsRes as { error: unknown }).error = null;
          } else {
            throw itemsRes.error;
          }
        }
        
        if (defectsRes.error) {
          if (defectsRes.error.code === 'PGRST205') {
            console.warn('[Rework API] Table rework_master_defects not found, defaulting to empty.');
            defectsRes.data = [];
            (defectsRes as { error: unknown }).error = null;
          } else {
            throw defectsRes.error;
          }
        }

        return NextResponse.json(
          {
            success: true,
            data: {
              items: itemsRes.data.map(i => ({
                itemNumber: i.item_number,
                itemName: i.item_name,
                itemCode: i.item_code
              })),
              defects: defectsRes.data.map(d => ({
                defectCode: d.defect_code,
                defectName: d.defect_name
              }))
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'saveItemMaster': {
        const { itemNumber, itemCode, itemName } = body;

        const trimmedNum = (itemNumber || '').trim();
        const trimmedCode = (itemCode || '').trim();
        const trimmedName = (itemName || '').trim();

        if (!trimmedNum) {
          console.log('[Rework API] Skipping saveItemMaster: itemNumber is empty.');
          return NextResponse.json(
            { success: true, message: 'ข้ามการบันทึก Item Master เนื่องจากไม่มี Item Number', data: null },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // 1. Conflict Check: check if itemNumber matches one row and itemCode matches another row
        let matchByNumber: MasterItem | null = null;
        let matchByCode: MasterItem | null = null;

        if (trimmedNum) {
          const { data: numMatches } = await supabaseServer
            .from('rework_master_items')
            .select('*')
            .eq('item_number', trimmedNum)
            .limit(1);
          if (numMatches && numMatches.length > 0) {
            matchByNumber = numMatches[0];
          }
        }

        if (trimmedCode) {
          const { data: codeMatches } = await supabaseServer
            .from('rework_master_items')
            .select('*')
            .eq('item_code', trimmedCode)
            .limit(1);
          if (codeMatches && codeMatches.length > 0) {
            matchByCode = codeMatches[0];
          }
        }

        let existingRecord: MasterItem | null = null;
        let resultData: MasterItem | null = null;

        if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
          // Check if names conflict
          const name1 = (matchByNumber.item_name || '').trim();
          const name2 = (matchByCode.item_name || '').trim();
          const hasNameConflict = name1 && name2 && name1.toLowerCase() !== name2.toLowerCase();

          if (hasNameConflict) {
            return NextResponse.json(
              { success: false, error: 'CONFLICT', message: 'รหัสสินค้ามีความซ้ำซ้อนในระบบ' },
              { status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
        }

        // ---------------------------------------------------------------------

        if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
          // No name conflict: Auto-Merge!
          const mergedName = (matchByNumber.item_name || '').trim() || (matchByCode.item_name || '').trim() || trimmedName;
          const { data: updatedRecord, error: updateErr } = await supabaseServer
            .from('rework_master_items')
            .update({
              item_code: trimmedCode,
              item_name: mergedName,
              item_number: trimmedNum
            })
            .eq('id', matchByNumber.id)
            .select()
            .single();

          if (updateErr) throw updateErr;

          // Delete matchByCode which is now merged into matchByNumber
          const { error: deleteErr } = await supabaseServer
            .from('rework_master_items')
            .delete()
            .eq('id', matchByCode.id);

          if (deleteErr) {
            console.error('Error deleting duplicate master item row during auto-merge:', deleteErr);
          }

          existingRecord = updatedRecord;
        } else {
          existingRecord = matchByNumber || matchByCode;
        }

        if (existingRecord) {
          // Check if it's already a complete item
          const dbNum = (existingRecord.item_number || '').trim();
          const dbCode = (existingRecord.item_code || '').trim();
          const dbName = (existingRecord.item_name || '').trim();
          const isComplete = dbNum && dbCode && dbName;

          if (isComplete) {
            // Already complete, skip updating to protect master data
            resultData = existingRecord;
          } else {
            // Update only missing values
            const updatePayload: Partial<Omit<MasterItem, 'id'>> = {};
            if (!dbNum && trimmedNum) updatePayload.item_number = trimmedNum;
            if (!dbCode && trimmedCode) updatePayload.item_code = trimmedCode;
            if (!dbName && trimmedName) updatePayload.item_name = trimmedName;

            if (Object.keys(updatePayload).length > 0) {
              const { data, error } = await supabaseServer
                .from('rework_master_items')
                .update(updatePayload)
                .eq('id', existingRecord.id)
                .select()
                .single();

              if (error) throw error;
              resultData = data;
            } else {
              resultData = existingRecord;
            }
          }
        } else {
          // Insert new record
          const { data, error } = await supabaseServer
            .from('rework_master_items')
            .insert([{
              item_number: trimmedNum,
              item_code: trimmedCode,
              item_name: trimmedName
            }])
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        }

        return NextResponse.json(
          { success: true, message: 'บันทึก Item เรียบร้อยแล้ว', data: resultData },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'uploadImage': {
        const { fileName, base64Data, contentType } = body;
        
        if (!fileName || !base64Data) {
          throw new Error('Missing fileName or base64Data');
        }

        const base64Clean = typeof base64Data === 'string' ? base64Data.replace(/^data:image\/\w+;base64,/, '') : base64Data;
        const buffer = Buffer.from(base64Clean, 'base64');
        const uniqueFileName = `${Date.now()}-${fileName}`;

        const { error } = await supabaseServer
          .storage
          .from('rework_images')
          .upload(uniqueFileName, buffer, {
            contentType: contentType || 'image/jpeg',
            upsert: false
          });

        if (error) {
          throw new Error(`Supabase Storage upload failed: ${error.message}`);
        }

        const { data: publicUrlData } = supabaseServer
          .storage
          .from('rework_images')
          .getPublicUrl(uniqueFileName);

        return NextResponse.json(
          { 
            success: true, 
            data: { url: publicUrlData.publicUrl } 
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'loginWithPassword': {
        const { profile, password } = body;
        const profileClean = (profile || '').trim().toLowerCase();

        if (!profileClean || !password) {
          return NextResponse.json(
            { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
            { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Query user from Supabase users table
        const { data: user, error: fetchError } = await supabaseServer
          .from('users')
          .select('id, username, password_hash, name, role')
          .eq('username', profileClean)
          .single();

        if (fetchError || !user) {
          return NextResponse.json(
            { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
            { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Verify password using scrypt
        const [salt, hash] = (user.password_hash || '').split(':');
        if (!salt || !hash) {
          return NextResponse.json(
            { success: false, error: 'รูปแบบรหัสผ่านในระบบไม่ถูกต้อง' },
            { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const hashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
        const verifyHash = hashBuffer.toString('hex');

        if (hash === verifyHash) {
          const role = user.role.toLowerCase();
          const token = await generateToken(profileClean, role);

          return NextResponse.json(
            {
              success: true,
              data: {
                token,
                user: {
                  email: profileClean,
                  name: user.name,
                  role
                },
                expiresIn: 8 * 3600
              }
            },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        return NextResponse.json(
          { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Unknown or unsupported action: ${action}` },
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }
    }
  } catch (error: unknown) {
    console.error('[Rework API] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message, statusCode: error.status },
        { status: error.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }
    const errMsg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'เกิดข้อผิดพลาดภายในระบบ');
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
