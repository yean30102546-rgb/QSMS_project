import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'fetchAllCases': {
        // Fetch cases and their nested items
        const { data, error } = await supabaseServer
          .from('rework_cases')
          .select(`
            *,
            items:rework_items(*)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to the format expected by the frontend
        const cases = data.map((c: any) => ({
          id: c.id,
          timestamp: c.created_at,
          status: c.status,
          profileId: c.profile_id,
          imageFolderUrl: c.image_folder_url,
          batchNo: c.batch_no,
          packagingDate: c.packaging_date,
          mold: c.mold,
          reworkCost: parseFloat(c.total_rework_cost || 0),
          resolutionMethod: c.resolution_method,
          items: c.items.map((i: any) => ({
            itemNumber: i.item_number,
            itemCode: i.item_code,
            itemName: i.item_name,
            defectCode: i.defect_code,
            defectName: i.defect_name,
            qtyRework: i.qty_rework,
            reworkReason: i.rework_reason
          }))
        }));

        return NextResponse.json({ success: true, data: cases });
      }

      case 'insertCase': {
        const { caseData } = body;
        
        // 1. Insert the main case
        const { error: caseError } = await supabaseServer
          .from('rework_cases')
          .insert([{
            id: caseData.id,
            status: caseData.status || 'Pending',
            profile_id: caseData.profileId,
            image_folder_url: caseData.imageFolderUrl,
            batch_no: caseData.batchNo,
            packaging_date: caseData.packagingDate,
            mold: caseData.mold,
            total_rework_cost: caseData.reworkCost || 0,
            resolution_method: caseData.resolutionMethod
          }]);

        if (caseError) throw caseError;

        // 2. Insert items
        if (caseData.items && caseData.items.length > 0) {
          const itemsToInsert = caseData.items.map((i: any) => ({
            case_id: caseData.id,
            item_number: i.itemNumber,
            item_code: i.itemCode,
            item_name: i.itemName,
            defect_code: i.defectCode,
            defect_name: i.defectName,
            qty_rework: i.qtyRework,
            rework_reason: i.reworkReason
          }));

          const { error: itemsError } = await supabaseServer
            .from('rework_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        return NextResponse.json({ success: true, data: caseData });
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

        // Log the action
        await supabaseServer.from('rework_logs').insert([{
          case_id: caseId,
          action: `Status updated to ${status}`,
          performed_by: performedBy || 'System'
        }]);

        return NextResponse.json({ success: true, data: { caseId, status } });
      }

      case 'deleteCase': {
        const { caseId } = body;
        // Soft delete
        const { error } = await supabaseServer
          .from('rework_cases')
          .update({ is_deleted: true })
          .eq('id', caseId);

        if (error) throw error;
        return NextResponse.json({ success: true, data: { caseId } });
      }

      // Actions that MUST go to GAS (Google Drive related)
      case 'uploadImage':
      case 'fetchImageDataUrl':
        return proxyToGAS(body);

      default:
        // Try proxying unknown actions to GAS for legacy support
        return proxyToGAS(body);
    }
  } catch (error: any) {
    console.error('Rework API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Proxy to legacy GAS backend for Google Drive operations
 */
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
