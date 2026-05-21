import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

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

    console.log(`🚀 Rework API Action: ${action}`, { bodyKeys: Object.keys(body) });

    switch (action) {
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
            profile_id: caseData.profileId,
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
        const { caseId, status, resolutionMethod, reworkCost, performedBy } = body;
        const updates = body.updates || {};

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
            status: status || updates.status, 
            resolution_method: resolutionMethod || updates.resolutionMethod,
            total_rework_cost: reworkCost !== undefined ? reworkCost : (updates.reworkCost !== undefined ? updates.reworkCost : 0),
            labor_count: updates.laborCount !== undefined ? updates.laborCount : 0,
            labor_hours: updates.laborHours !== undefined ? updates.laborHours : 0,
            labor_rate: updates.laborRate !== undefined ? updates.laborRate : 0,
            materials: updates.materials || [],
            customer_name: updates.customerName,
            source: updates.source,
            or_files_urls: gasResponse.data?.orFilesUrls || updates.orFilesUrls || [],
            or_folder_url: gasResponse.data?.orFolderUrl || updates.orFolderUrl || '',
            updated_at: getBangkokISOString()
          })
          .eq('id', caseId);

        if (caseUpdateError) throw caseUpdateError;

        // 4. Log the update
        await supabaseServer.from('rework_logs').insert([{
          case_id: caseId,
          action: `Status updated to ${status || updates.status}`,
          performed_by: performedBy || 'System',
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
        const { itemNumber } = body;
        const { data, error } = await supabaseServer
          .from('rework_master_items')
          .select('*')
          .or(`item_number.eq.${itemNumber},item_code.eq.${itemNumber}`)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        return NextResponse.json(
          { success: true, data: { found: true, itemName: data.item_name, itemCode: data.item_code, itemNumber: data.item_number } },
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

        const { data, error } = await supabaseServer
          .from('rework_master_items')
          .upsert(
            { item_number: itemNumber, item_code: itemCode, item_name: itemName },
            { onConflict: 'item_number' }
          )
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(
          { success: true, message: 'บันทึก Item เรียบร้อยแล้ว', data },
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

      default: {
        const result = await proxyToGAS(body);
        return NextResponse.json(result, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Rework API Error:', error);
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
