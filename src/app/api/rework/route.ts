import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { assertPermission, AuthError, requireServerAuth } from '../../../lib/serverAuth';
import { generateCaseId } from '../../../utils/helpers';

export const maxDuration = 60; // Allow up to 60s for slow GAS file uploads
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


interface DBMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface GasResponse {
  success: boolean;
  error?: string;
  data?: {
    caseId?: string;
    caseFolderUrl?: string;
    orFolderUrl?: string;
    orFilesUrls?: string[];
    items?: Array<{
      id: string;
      imageUrls?: string[];
      imageFolderUrl?: string;
    }>;
  };
}

interface DBCase {
  id: string;
  case_name?: string;
  submission_date: string;
  created_at: string;
  source: string;
  customer_name?: string;
  status: string;
  profile_id: string;
  image_folder_url?: string;
  or_folder_url?: string;
  or_files_urls?: string[];
  batch_no?: string;
  packaging_date?: string;
  mold?: string;
  total_rework_cost?: number | string;
  resolution_method?: string;
  labor_count?: number;
  labor_hours?: number | string;
  labor_rate?: number | string;
  materials?: DBMaterial[];
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

    console.log(`🚀 Rework API Action: ${action}`, { bodyKeys: Object.keys(body) });

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
        let awaitingValuation = 0;
        let completed = 0;

        (casesRes.data || []).forEach((c: { status: string }) => {
          if (c.status === 'Pending') pending++;
          else if (c.status === 'In-Progress') inProgress++;
          else if (c.status === 'Awaiting Valuation') awaitingValuation++;
          else if (c.status === 'Completed') completed++;
        });

        const totalCases = pending + inProgress + awaitingValuation + completed;
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
                awaitingValuation,
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
          console.error('❌ Supabase fetch error:', error);
          throw error;
        }

        const cases = data.map((c: DBCase) => ({
          id: c.id,
          caseName: c.case_name || c.id,
          date: c.submission_date,
          timestamp: c.created_at,
          source: c.source,
          customerName: c.customer_name,
          status: c.status,
          profileId: c.profile_id,
          imageFolderUrl: c.image_folder_url,
          orFolderUrl: c.or_folder_url,
          orFilesUrls: c.or_files_urls || [],
          batchNo: c.batch_no,
          packagingDate: c.packaging_date,
          mold: c.mold,
          reworkCost: parseFloat(String(c.total_rework_cost || 0)),
          resolutionMethod: c.resolution_method,
          laborCount: c.labor_count,
          laborHours: parseFloat(String(c.labor_hours || 0)),
          laborRate: parseFloat(String(c.labor_rate || 0)),
          materials: c.materials || [],
          items: (c.items || []).map((i: DBItem) => ({
            id: i.id,
            itemNumber: i.item_number,
            itemCode: i.item_code,
            itemName: i.item_name,
            amount: parseFloat(String(i.amount || 0)),
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

        console.log('📦 Inserting Case Data:', {
          id: caseData?.id,
          itemCount: caseData?.items?.length,
          hasOrFiles: !!caseData?.orFiles?.length,
          isFastTrack
        });

        // Generate Case ID if missing or temporary
        let finalCaseId = caseData?.id;
        const isTemporaryId = !finalCaseId || String(finalCaseId).startsWith('temp-') || String(finalCaseId).length < 5;
        
        if (isTemporaryId) {
          const prefix = caseData?.source === 'Customer' ? 'RT' : 'RW';
          finalCaseId = generateCaseId(prefix);
        }

        // 1. Upload OR Files
        const orFilesUrls: string[] = [];
        if (caseData.orFiles && caseData.orFiles.length > 0) {
          for (const base64 of caseData.orFiles) {
            const url = await uploadBase64Image(base64, `or-${finalCaseId}`);
            orFilesUrls.push(url);
          }
        }

        const primaryCustomer = caseData.customerName || (caseData.items && caseData.items[0]?.customerName) || '';

        // 2. Insert Case
        const { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([{
            id: finalCaseId,
            case_name: caseData.caseName || finalCaseId,
            submission_date: caseData.date || getBangkokDateString(),
            source: caseData.source,
            customer_name: primaryCustomer,
            status: caseData.status || 'Pending',
            profile_id: auth.profile,
            image_folder_url: '',
            or_folder_url: '',
            or_files_urls: caseData.orFilesUrls || orFilesUrls,
            batch_no: caseData.batchNo,
            packaging_date: caseData.packagingDate,
            mold: caseData.mold,
            total_rework_cost: caseData.reworkCost || 0,
            resolution_method: caseData.resolutionMethod,
            labor_count: caseData.laborCount || 0,
            labor_hours: caseData.laborHours || 0,
            labor_rate: caseData.laborRate || 0,
            materials: caseData.materials || [],
            created_at: getBangkokISOString(),
            updated_at: getBangkokISOString()
          }]);

        if (caseError) {
          console.error('❌ Supabase case insert error:', caseError);
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
              created_at: getBangkokISOString()
            });
          }

          const { error: itemsError } = await supabaseServer
            .from('rework_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error('❌ Supabase items insert error:', itemsError);
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
        const hasValuationChange =
          reworkCost !== undefined ||
          updates.reworkCost !== undefined ||
          updates.laborRate !== undefined;
        const hasResolutionChange =
          resolutionMethod !== undefined ||
          updates.resolutionMethod !== undefined;

        if (hasValuationChange) {
          assertPermission(auth, 'fill_valuation');
        }

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
          .select('status, resolution_method, total_rework_cost, labor_count, labor_hours, labor_rate, materials, customer_name, source, or_files_urls, or_folder_url, case_name')
          .eq('id', caseId)
          .maybeSingle();

        if (existingCaseError) throw existingCaseError;
        if (!existingCase) throw new Error(`Case ${caseId} not found`);

        // 1. Delete items if deleteItemIds exists
        if (updates.deleteItemIds && updates.deleteItemIds.length > 0) {
          const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          const uuidIds = updates.deleteItemIds.filter(isUuid);
          const otherIds = updates.deleteItemIds.filter((id: string) => !isUuid(id));

          if (uuidIds.length > 0) {
            const { error: delError1 } = await supabaseServer.from('rework_items').delete().eq('case_id', caseId).in('id', uuidIds);
            if (delError1) console.error('Error deleting items by UUID:', delError1);
          }
          if (otherIds.length > 0) {
            const { error: delError2 } = await supabaseServer.from('rework_items').delete().eq('case_id', caseId).in('uid', otherIds);
            if (delError2) console.error('Error deleting items by UID:', delError2);
          }
        }

        // 2. Insert or update items
        if (updates.items && Array.isArray(updates.items)) {
          const { data: existingDbItems } = await supabaseServer
            .from('rework_items')
            .select('id, uid')
            .eq('case_id', caseId);

          const existingUids = new Set(existingDbItems?.map(x => x.uid).filter(Boolean) || []);
          const existingIds = new Set(existingDbItems?.map(x => x.id).filter(Boolean) || []);

          for (const item of updates.items) {
            const itemData = {
              case_id: caseId,
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
              image_urls: item.imageUrls || [],
              image_folder_url: item.imageFolderUrl
            };

            if (item.id && existingIds.has(item.id)) {
              await supabaseServer.from('rework_items').update(itemData).eq('id', item.id);
            } else if (item.uid && existingUids.has(item.uid)) {
              await supabaseServer.from('rework_items').update(itemData).eq('uid', item.uid);
            } else {
              await supabaseServer.from('rework_items').insert([{
                ...itemData,
                created_at: getBangkokISOString()
              }]);
            }
          }
        }

        // 3. Update the case record
        const { error: caseUpdateError } = await supabaseServer
          .from('rework_cases')
          .update({
            status: status ?? updates.status ?? existingCase.status,
            resolution_method: resolutionMethod ?? updates.resolutionMethod ?? existingCase.resolution_method,
            total_rework_cost: reworkCost ?? updates.reworkCost ?? existingCase.total_rework_cost,
            labor_count: updates.laborCount ?? existingCase.labor_count,
            labor_hours: updates.laborHours ?? existingCase.labor_hours,
            labor_rate: updates.laborRate ?? existingCase.labor_rate,
            materials: updates.materials ?? existingCase.materials ?? [],
            customer_name: updates.customerName ?? existingCase.customer_name,
            source: updates.source ?? existingCase.source,
            case_name: updates.caseName ?? existingCase.case_name,
            or_files_urls: updates.orFilesUrls ? [...updates.orFilesUrls, ...newOrFilesUrls] : [...(existingCase.or_files_urls || []), ...newOrFilesUrls],
            or_folder_url: '',
            updated_at: getBangkokISOString()
          })
          .eq('id', caseId);

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
        const { itemNumber, itemCode } = body;

        const conditions: string[] = [];
        if (itemNumber) conditions.push(`item_number.eq.${itemNumber}`);
        if (itemCode) conditions.push(`item_code.eq.${itemCode}`);

        if (conditions.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const { data, error } = await supabaseServer
          .from('rework_master_items')
          .select('*')
          .or(conditions.join(','))
          .limit(2);

        if (error) throw error;

        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Detect identity conflict: itemNumber matches one row, itemCode matches another
        if (itemNumber && itemCode && data.length > 1) {
          const matchByNumber = data.find(r => r.item_number === itemNumber);
          const matchByCode = data.find(r => r.item_code === itemCode);

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
              itemName: record.item_name,
              itemCode: record.item_code,
              itemNumber: record.item_number
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
            console.warn('⚠️ Table rework_master_items not found, defaulting to empty.');
            itemsRes.data = [];
            (itemsRes as { error: unknown }).error = null;
          } else {
            throw itemsRes.error;
          }
        }
        
        if (defectsRes.error) {
          if (defectsRes.error.code === 'PGRST205') {
            console.warn('⚠️ Table rework_master_defects not found, defaulting to empty.');
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
          console.log('⚠️ Skipping saveItemMaster: itemNumber is empty.');
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

        const { data, error } = await supabaseServer
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
        const profileLower = (profile || '').toLowerCase();

        // MOCK ACCOUNTS
        const mockAccounts: Record<string, { pass: string, role: string, name: string }> = {
          'qsms': { pass: 'Qsms123', role: 'qsms', name: 'QSMS Test' },
          'operator': { pass: 'Operator123', role: 'operator', name: 'Operator Test' },
          'finance': { pass: 'Finance123', role: 'finance', name: 'Finance Test' }
        };

        if (mockAccounts[profileLower]) {
          if (mockAccounts[profileLower].pass === password) {
            // Generate a fake JWT token that passes frontend AND backend validation
            const headerObj = { alg: 'HS256', typ: 'JWT' };
            const payloadObj = {
              sub: profileLower,
              profile: mockAccounts[profileLower].role, // MUST match serverAuth.ts expectation
              exp: Math.floor(Date.now() / 1000) + (8 * 3600),
              type: 'auth_token'
            };

            const headerStr = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
            const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
            const unsignedToken = `${headerStr}.${payloadStr}`;

            // Sign the token using AUTH_SECRET (same logic as serverAuth.ts)
            const AUTH_SECRET = (process.env.AUTH_TOKEN_SECRET || process.env.GAS_AUTH_TOKEN_SECRET || '').trim();
            if (!AUTH_SECRET) {
              return NextResponse.json(
                { success: false, error: 'AUTH_TOKEN_SECRET is not configured on the server.', statusCode: 500 },
                { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
              );
            }

            const key = await crypto.subtle.importKey(
              'raw',
              new TextEncoder().encode(AUTH_SECRET),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign'],
            );
            const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken));
            const signatureStr = Buffer.from(signature).toString('base64url');
            const mockToken = `${unsignedToken}.${signatureStr}`;

            return NextResponse.json(
              {
                success: true,
                data: {
                  token: mockToken,
                  user: {
                    email: `${profileLower}@test.com`,
                    name: mockAccounts[profileLower].name,
                    role: mockAccounts[profileLower].role
                  },
                  expiresIn: 8 * 3600
                }
              },
              { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          } else {
            return NextResponse.json(
              { success: false, error: 'รหัสผ่านไม่ถูกต้อง (Mock)' },
              { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
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
    console.error('❌ Rework API Error:', error);
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
