import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

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
            imageFolderUrl: i.image_folder_url
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
        // We use the original GAS 'insert' action logic
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
        // GAS returns updated itemIds, timestamp, and potentially URLs (if we modified GAS)
        // For now, we use GAS response to confirm it's safe to save to Supabase
        
        // Extract customer name from first item as fallback for case-level
        const primaryCustomer = caseData.customerName || (caseData.items && caseData.items[0]?.customerName) || '';

        const { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([{
            id: caseData.id,
            submission_date: caseData.date || new Date().toISOString().split('T')[0],
            source: caseData.source,
            customer_name: primaryCustomer,
            status: caseData.status || 'Pending',
            profile_id: caseData.profileId,
            image_folder_url: gasResponse.data?.caseFolderUrl || caseData.imageFolderUrl, // Use GAS folder if returned
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
            materials: caseData.materials || []
          }]);

        if (caseError) {
          console.error('❌ Supabase case insert error:', caseError);
          throw caseError;
        }

        // 3. Insert items with full coverage and generated URLs from GAS
        if (caseData.items && caseData.items.length > 0) {
          const itemsToInsert = caseData.items.map((i: any, index: number) => {
            // If GAS returned specific image URLs, map them here
            const gasItem = gasResponse.data?.items?.[index] || {};
            
            return {
              case_id: caseData.id,
              item_number: i.itemNumber,
              item_code: i.itemCode,
              item_name: i.itemName,
              amount: i.amount || 0,
              reason: i.reason,
              reason_subtype: i.reasonSubtype,
              responsible: i.responsible,
              responsibleSubtype: i.responsibleSubtype,
              details: i.details,
              line: i.line,
              image_urls: gasItem.imageUrls || i.imageUrls || [],
              image_folder_url: gasItem.imageFolderUrl || i.imageFolderUrl
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
          { success: true, data: { caseId: caseData.id, gasResult: gasResponse.data } },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      case 'updateCaseStatus': {
        const { caseId, status, resolutionMethod, reworkCost, performedBy } = body;
        
        const { error } = await supabaseServer
          .from('rework_cases')
          .update({ 
            status, 
            resolution_method: resolutionMethod,
            total_rework_cost: reworkCost,
            updated_at: new Date().toISOString()
          })
          .eq('id', caseId);

        if (error) throw error;

        await supabaseServer.from('rework_logs').insert([{
          case_id: caseId,
          action: `Status updated to ${status}`,
          performed_by: performedBy || 'System'
        }]);

        return NextResponse.json(
          { success: true, data: { caseId, status } },
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
      case 'fetchImageDataUrl':
        return proxyToGAS(body);

      default:
        return proxyToGAS(body);
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
  const gasUrl = (process.env.GAS_WEB_APP_URL || '').trim();
  if (!gasUrl) {
    console.error('❌ GAS_WEB_APP_URL not configured');
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
