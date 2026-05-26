import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { assertPermission, AuthError, requireServerAuth } from '../../../lib/serverAuth';

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

        (casesRes.data || []).forEach((c: any) => {
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
        todayLeavesRes.data.forEach((l: any) => {
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

        const cases = data.map((c: any) => ({
          id: c.id,
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
          reworkCost: parseFloat(c.total_rework_cost || 0),
          resolutionMethod: c.resolution_method,
          laborCount: c.labor_count,
          laborHours: parseFloat(c.labor_hours || 0),
          laborRate: parseFloat(c.labor_rate || 0),
          materials: c.materials || [],
          items: (c.items || []).map((i: any) => ({
            id: i.id,
            itemNumber: i.item_number,
            itemCode: i.item_code,
            itemName: i.item_name,
            amount: parseFloat(i.amount || 0),
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
        console.log('📦 Inserting Case Data:', { 
          id: caseData?.id, 
          itemCount: caseData?.items?.length,
          hasOrFiles: !!caseData?.orFiles?.length
        });

        if (!caseData || !caseData.id) {
          throw new Error('Invalid case data: Missing ID');
        }

        // 1. Proxy to GAS first to handle Google Drive (Images/Folders) and LINE notifications
        console.log('☁️ Proxying to GAS for Drive/Notifications...');
        const gasPayload = {
          ...body,
          action: 'insert', // GAS uses 'insert'
          items: caseData.items,
          source: caseData.source,
          orFiles: caseData.orFiles
        };
        
        const gasResponse = await proxyToGAS(gasPayload);
        console.log('🔄 GAS Response:', gasResponse);

        if (!gasResponse.success) {
          console.error('❌ GAS Proxy failed:', gasResponse.error);
          throw new Error(`Google Drive sync failed: ${gasResponse.error}`);
        }

        // 2. Prepare Supabase Data using results from GAS if available
        const primaryCustomer = caseData.customerName || (caseData.items && caseData.items[0]?.customerName) || '';
        const finalCaseId = gasResponse.data?.caseId || caseData.id;

        const { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([{
            id: finalCaseId,
            submission_date: caseData.date || getBangkokDateString(),
            source: caseData.source,
            customer_name: primaryCustomer,
            status: caseData.status || 'Pending',
            profile_id: auth.profile,
            image_folder_url: gasResponse.data?.caseFolderUrl || caseData.imageFolderUrl,
            or_folder_url: gasResponse.data?.orFolderUrl || caseData.orFolderUrl,
            or_files_urls: gasResponse.data?.orFilesUrls || caseData.orFilesUrls || [],
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

        // 3. Insert items with full coverage and generated URLs from GAS
        if (caseData.items && caseData.items.length > 0) {
          const itemsToInsert = caseData.items.map((i: any, index: number) => {
            const gasItem = gasResponse.data?.items?.[index] || {};
            
            return {
              case_id: finalCaseId,
              item_number: i.itemNumber,
              item_code: i.itemCode,
              item_name: i.itemName,
              amount: i.amount || 0,
              reason: i.reason,
              reason_subtype: i.reasonSubtype,
              responsible: i.responsible,
              responsible_subtype: i.responsibleSubtype,
              details: i.details,
              line: i.line,
              image_urls: gasItem.imageUrls || i.imageUrls || [],
              image_folder_url: gasItem.imageFolderUrl || i.imageFolderUrl,
              customer_name: i.customerName || primaryCustomer,
              batch_no: i.batchNo || caseData.batchNo,
              packaging_date: i.packagingDate || caseData.packagingDate,
              mold: i.mold || caseData.mold,
              uid: i.uid || i.id,
              created_at: getBangkokISOString()
            };
          });

          const { error: itemsError } = await supabaseServer
            .from('rework_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error('❌ Supabase items insert error:', itemsError);
            throw itemsError;
          }
        }

        return NextResponse.json(
          { success: true, data: { caseId: finalCaseId, gasResult: gasResponse.data } },
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

        console.log(`☁️ Proxying update to GAS for Case ID: ${caseId}...`);
        const gasResponse = await proxyToGAS({
          ...body,
          action: 'update'
        });
        console.log('🔄 GAS Update Response:', gasResponse);

        if (!gasResponse.success) {
          console.error('❌ GAS Update Proxy failed:', gasResponse.error);
          throw new Error(`Google Sheets sync failed: ${gasResponse.error}`);
        }

        const { data: existingCase, error: existingCaseError } = await supabaseServer
          .from('rework_cases')
          .select('status, resolution_method, total_rework_cost, labor_count, labor_hours, labor_rate, materials, customer_name, source, or_files_urls, or_folder_url')
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
            or_files_urls: gasResponse.data?.orFilesUrls ?? updates.orFilesUrls ?? existingCase.or_files_urls ?? [],
            or_folder_url: gasResponse.data?.orFolderUrl ?? updates.orFolderUrl ?? existingCase.or_folder_url ?? '',
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
              orFilesUrls: gasResponse.data?.orFilesUrls || updates.orFilesUrls || [],
              orFolderUrl: gasResponse.data?.orFolderUrl || updates.orFolderUrl || ''
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
          .limit(1);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
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

        if (itemsRes.error) throw itemsRes.error;
        if (defectsRes.error) throw defectsRes.error;

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
        let matchByNumber: any = null;
        let matchByCode: any = null;

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

        let existingRecord = null;
        let resultData = null;

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

          // No name conflict: Auto-Merge!
          const mergedName = name1 || name2 || trimmedName;
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
            const updatePayload: any = {};
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

        // Also proxy to GAS to update Google Sheet ItemMaster
        console.log('☁️ Proxying saveItemMaster to GAS...');
        try {
          await proxyToGAS({
            ...body,
            itemNumber: trimmedNum,
            itemCode: trimmedCode,
            itemName: trimmedName
          });
        } catch (gasErr) {
          console.error('Error proxying saveItemMaster to GAS:', gasErr);
        }

        return NextResponse.json(
          { success: true, message: 'บันทึก Item เรียบร้อยแล้ว', data: resultData },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'uploadImage':
      case 'fetchImageDataUrl': {
        const result = await proxyToGAS(body);
        return NextResponse.json(result, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
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

        // Fallback to GAS
        const result = await proxyToGAS(body);
        return NextResponse.json(result, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      default: {
        const result = await proxyToGAS(body);
        return NextResponse.json(result, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Rework API Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message, statusCode: error.status },
        { status: error.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

async function proxyToGAS(body: any) {
  const gasUrl = (
    process.env.GAS_WEB_APP_URL || 
    process.env.REACT_APP_GAS_WEB_APP_URL || 
    process.env.VITE_GAS_WEB_APP_URL || 
    ''
  ).trim();

  if (!gasUrl) {
    console.error('❌ GAS_WEB_APP_URL not configured (checked multiple prefixes)');
    return { success: false, error: 'Legacy GAS backend URL not configured.' };
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { success: false, error: `Legacy backend error: ${response.status}` };
    }

    return await response.json();
  } catch (err: any) {
    console.error('❌ GAS Proxy Error:', err);
    return { success: false, error: err.message || 'GAS Communication failed' };
  }
}
