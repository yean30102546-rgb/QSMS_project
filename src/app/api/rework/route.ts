import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

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

        if (error) throw error;

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
          items: c.items.map((i: any) => ({
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
        
        const { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([{
            id: caseData.id,
            submission_date: caseData.date,
            source: caseData.source,
            customer_name: caseData.customerName,
            status: caseData.status || 'Pending',
            profile_id: caseData.profileId,
            image_folder_url: caseData.imageFolderUrl,
            or_folder_url: caseData.orFolderUrl,
            or_files_urls: caseData.orFilesUrls || [],
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

        if (caseError) throw caseError;

        if (caseData.items && caseData.items.length > 0) {
          const itemsToInsert = caseData.items.map((i: any) => ({
            case_id: caseData.id,
            item_number: i.itemNumber,
            item_code: i.itemCode,
            item_name: i.itemName,
            amount: i.amount || 0,
            reason: i.reason,
            reason_subtype: i.reason_subtype,
            responsible: i.responsible,
            responsible_subtype: i.responsible_subtype,
            details: i.details,
            line: i.line,
            image_urls: i.imageUrls || [],
            image_folder_url: i.imageFolderUrl
          }));

          const { error: itemsError } = await supabaseServer
            .from('rework_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        return NextResponse.json(
          { success: true, data: caseData },
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
          .eq('item_number', itemNumber)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        return NextResponse.json(
          { success: true, data: { found: true, itemName: data.item_name, itemCode: data.item_code } },
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
    console.error('Rework API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

async function proxyToGAS(body: any) {
  const gasUrl = (process.env.GAS_WEB_APP_URL || '').trim();
  if (!gasUrl) {
    return NextResponse.json(
      { success: false, error: 'Legacy GAS backend URL not configured.' },
      { status: 500 }
    );
  }

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: `Legacy backend error: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
