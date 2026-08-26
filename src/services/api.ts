/**
 * API Service
 * Contains functions for interacting with the backend
 */

import { getCurrentUser, isAuthenticated } from './auth';
import { compressImage } from '@/src/utils/imageCompressionUtils';
import { uploadImageToCloudinary } from './imageUploadService';



export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  details?: Array<{ itemIndex: number; errors: string[] }>;
}

export type CaseStatus = 
  | 'Pending Analysis'
  | 'Awaiting Materials'
  | 'In-Progress'
  | 'Blocked'
  | 'Completed'
  | 'Pending'; // Legacy fallback

export interface ReworkItem {
  id: string;
  itemNumber: string;
  itemName: string;
  itemCode: string;
  amount: number;
  reason: string;
  reasonSubtype?: string;
  responsible: string;
  responsibleSubtype?: string;
  details?: string;
  imageUrls?: string[];
  imageFolderUrl?: string; // URL ของ folder ที่เก็บรูปทั้งหมดของ case นี้ (Legacy)
  status?: CaseStatus;
  batchNo?: string;
  gallonDate?: string;
  boxNumber?: string;
  packagingDate?: string;
  mold?: string;
  line?: string;
  linkedSourceId?: string;
  customerName?: string;
  imageCount?: number;
  completedBoxes?: number;
  uid?: string; // Stable unique ID from backend
  lastActiveField?: 'itemNumber' | 'itemCode'; // Tracks user priority
  verificationStatus?: 'idle' | 'checking' | 'verified' | 'new' | 'failed' | 'updating' | 'conflict';
}

export const CUSTOMER_OPTIONS = [
  'Eneos',
  'Valvoline',
  'BCP',
  'OR',
  'Petronas',
  'Others',
];

export interface MaterialRequestItem {
  id: string;
  materialName: string;
  requestedQty: number;
  unit: string;
  issuedQty?: number;
  notes?: string;
  status?: 'pending' | 'fulfilled' | 'partial' | 'unavailable';
}

export interface BlockedDefendInfo {
  isBlocked: boolean;
  reasonCategory?: 'waiting_oil' | 'waiting_container' | 'waiting_label' | 'waiting_cap' | 'waiting_machine' | 'waiting_lab' | 'other' | string;
  reasonDetail?: string;
  blockedAt?: string;
  reportedBy?: string;
  reportedByRole?: string;
  history?: Array<{
    action: 'blocked' | 'unblocked';
    reasonCategory?: string;
    reasonDetail?: string;
    timestamp: string;
    user: string;
    role: string;
  }>;
}

export interface ReworkCase {
  id: string;
  caseName?: string;
  caseSequence?: number;
  date: string;
  timestamp?: string;
  source: string;
  customerName?: string;
  status: CaseStatus;
  items: ReworkItem[];
  resolutionMethod?: string;
  orFilesUrls?: string[];
  orFolderUrl?: string;
  missingBoxes?: number;
  missingGallons?: number;
  missingOil?: number;
  materialRequests?: MaterialRequestItem[];
  blockedInfo?: BlockedDefendInfo;
  createdByRole?: string;
  createdByName?: string;
}

export interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  inProgressCases: number;
  completedCases: number;
  completionRate: number;
  defectReasons: Record<string, number>;
  sourceWorkload: Record<string, number>;
}

type ReworkCaseResponse = ReworkCase & {
  itemsRaw?: Array<Partial<ReworkItem> & { itemId?: string; url?: string; urls?: string[] }>;
  missingBoxes?: number;
  missingGallons?: number;
  missingOil?: number;
  material_requests?: MaterialRequestItem[];
  blocked_info?: BlockedDefendInfo;
  created_by_role?: string;
  created_by_name?: string;
  case_sequence?: number;
};

/**
 * ฟังก์ชันช่วยแปลงไฟล์ภาพเป็น Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const DEFAULT_HEADERS = { 'Content-Type': 'text/plain' };
const imageDataUrlCache = new Map<string, string>();

function parseTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload + '='.repeat((4 - (payload.length % 4)) % 4));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function apiFetch<T>(payload: Record<string, unknown>): Promise<ApiResponse<T>> {
  // Verify user is authenticated
  if (!isAuthenticated()) {
    throw new Error('Authentication required. Please login again.');
  }

  try {
    const currentUser = getCurrentUser();
    const authProfile = String(currentUser?.role || '').trim().toUpperCase();
    const authEmail = currentUser?.email ? String(currentUser.email).trim() : '';

    // Call our server-side Next.js secure API Proxy
    // Note: token is automatically sent via HTTP-Only cookie 'auth_token'
    const response = await fetch('/api/rework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...payload,
        authProfile,
        authEmail,
        userRole: currentUser?.role || '' // Include userRole for backend validation
      }),
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }

      if (contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      } else {
        const errorText = await response.text().catch(() => '');
        console.error(`HTTP ${response.status} Non-JSON Response:`, errorText.substring(0, 200));
        throw new Error(`Server returned error status ${response.status}`);
      }
    }

    if (!contentType.includes('application/json')) {
      const nonJsonText = await response.text().catch(() => '');
      console.error('Expected JSON but received non-JSON response:', nonJsonText.substring(0, 200));
      throw new Error('Server returned non-JSON response. Please check server logs.');
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (!result.success && result.statusCode === 401) {
      throw new Error(result.error || 'Session expired. Please login again.');
    }

    return result;
  } catch (error) {
    console.error('API Call Failure:', error);
    throw error;
  }
}

/**
 * 1. Insert a new rework case (แก้ไขการส่งเป็น JSON + Base64 Images)
 */
export async function insertCase(
  source: string,
  items: ReworkItem[],
  imageData?: Record<string, File[]>,
  orFiles?: File[],
  customCaseId?: string,
  isFastTrack?: boolean,
  caseName?: string,
  customerName?: string
): Promise<ApiResponse<{ caseId: string; itemIds: string[] }>> {
  const allUploadedUrls: string[] = [];
  try {
    const processedItems = await Promise.all(items.map(async (item) => {
      const files = imageData && imageData[item.id] ? imageData[item.id] : [];

      const newUrls: string[] = [];
      for (const file of files) {
        const compression = await compressImage(file, { maxSizeMB: 0.3 }); // Target 300KB
        const fileToUpload = compression.success && compression.compressedFile ? compression.compressedFile : file;
        
        const uploadResult = await uploadImageToCloudinary(fileToUpload);
        if (uploadResult.success && uploadResult.url) {
          newUrls.push(uploadResult.url);
          allUploadedUrls.push(uploadResult.url);
        } else {
          console.error(`Failed to upload image to Cloudinary for item ${item.itemNumber}:`, uploadResult.error);
        }
      }

      return {
        ...item,
        amount: item.amount || 0,
        batchNo: item.batchNo || '',
        boxNumber: item.boxNumber || '',
        packagingDate: item.packagingDate || '',
        mold: item.mold || '',
        line: item.line || '',
        linkedSourceId: item.linkedSourceId || '',
        customerName: item.customerName || customerName || '',
        imageUrls: [...(item.imageUrls || []), ...newUrls],
        images: [] as string[] // ไม่ต้องส่ง base64 แล้ว
      };
    }));

    // Use custom Case ID if provided, otherwise fallback to auto-generated timestamp ID
    const caseId = customCaseId || undefined;

    console.log('📦 Sending case to API:', {
      source,
      caseId,
      caseName,
      customerName,
      itemCount: processedItems.length,
      isFastTrack,
      totalImages: processedItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      orFilesCount: orFiles?.length || 0
    });

    // Upload OR files to Cloudinary if any
    const processedOrFilesUrls: string[] = [];
    if (orFiles && orFiles.length > 0) {
      for (const file of orFiles) {
        const compression = await compressImage(file, { maxSizeMB: 0.3 });
        const fileToUpload = compression.success && compression.compressedFile ? compression.compressedFile : file;
        const uploadResult = await uploadImageToCloudinary(fileToUpload);
        if (uploadResult.success && uploadResult.url) {
          processedOrFilesUrls.push(uploadResult.url);
          allUploadedUrls.push(uploadResult.url);
        }
      }
    }

    const result = await apiFetch<{ caseId: string; itemIds: string[] }>({
      action: 'insertCase',
      caseData: {
        id: caseId,
        caseName: caseName || undefined,
        customerName: customerName || undefined,
        date: new Date().toISOString().split('T')[0],
        source,
        profileId: getCurrentUser()?.name || 'User',
        items: processedItems,
        orFilesUrls: processedOrFilesUrls,
        isFastTrack
      }
    });

    if (result.success) {
      console.log('✓ Case inserted successfully:', result.data);
    } else {
      console.error('✗ Case insertion failed:', result.error);
      if (allUploadedUrls.length > 0) {
        fetch('/api/cloudinary/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: allUploadedUrls })
        }).catch(e => console.error('Rollback API failed:', e));
      }
    }

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      errorCode: result.errorCode,
      details: result.details
    };
  } catch (error) {
    console.error('Error inserting case:', error);
    if (allUploadedUrls.length > 0) {
      fetch('/api/cloudinary/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: allUploadedUrls })
      }).catch(e => console.error('Rollback API failed:', e));
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to insert case',
    };
  }
}

function normalizeString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function createNormalizedItemId(
  caseId: string,
  item: Partial<ReworkItem> & { itemId?: string },
  index: number,
  seenIds: Map<string, number>
): string {
  const preferredId = normalizeString(item.id || item.itemId);
  const fallbackBase = [
    caseId || 'case',
    normalizeString(item.itemNumber) || 'item',
    normalizeString(item.reason) || 'reason',
    String(index + 1).padStart(3, '0'),
  ].join('__');
  const baseId = preferredId || fallbackBase;
  const duplicateCount = seenIds.get(baseId) || 0;
  seenIds.set(baseId, duplicateCount + 1);
  return duplicateCount === 0 ? baseId : `${baseId}__${duplicateCount + 1}`;
}

function normalizeCaseItems(caseItem: ReworkCaseResponse): ReworkItem[] {
  const sourceItems = Array.isArray(caseItem.items) && caseItem.items.length > 0
    ? caseItem.items
    : caseItem.itemsRaw || [];
  const seenIds = new Map<string, number>();

  return sourceItems.map((item, index) => {
    const rawItem = item as Record<string, unknown> & Partial<ReworkItem> & {
      urls?: string[];
      url?: string;
      batch_no?: string;
      linked_source_id?: string;
    };

    const imageUrls = Array.isArray(rawItem.imageUrls)
      ? rawItem.imageUrls
      : Array.isArray(rawItem.urls)
        ? rawItem.urls
        : rawItem.url
          ? [normalizeString(rawItem.url)]
          : [];

    return {
      id: createNormalizedItemId(caseItem.id, item, index, seenIds),
      itemNumber: normalizeString(rawItem.itemNumber),
      itemName: normalizeString(rawItem.itemName),
      itemCode: normalizeString(rawItem.itemCode),
      amount: normalizeAmount(rawItem.amount),
      reason: normalizeString(rawItem.reason),
      reasonSubtype: normalizeString(rawItem.reasonSubtype),
      responsible: normalizeString(rawItem.responsible),
      responsibleSubtype: normalizeString(rawItem.responsibleSubtype),
      details: normalizeString(rawItem.details),
      status: rawItem.status || caseItem.status || 'Pending',
      imageUrls,
      imageFolderUrl: normalizeString(rawItem.imageFolderUrl),
      batchNo: normalizeString(rawItem.batchNo || rawItem.batch_no),
      boxNumber: normalizeString(rawItem.boxNumber || rawItem.packagingDate),
      mold: normalizeString(rawItem.mold),
      line: normalizeString(rawItem.line),
      linkedSourceId: normalizeString(rawItem.linkedSourceId || rawItem.linked_source_id),
      customerName: normalizeString(rawItem.customerName),
      uid: normalizeString(rawItem.uid),
      completedBoxes: Number(rawItem.completedBoxes) || 0,
    };
  });
}

function normalizeCases(cases: ReworkCaseResponse[]): ReworkCase[] {
  return cases.map((caseItem) => ({
    id: normalizeString(caseItem.id),
    caseName: caseItem.caseName ? normalizeString(caseItem.caseName) : undefined,
    caseSequence: caseItem.caseSequence || caseItem.case_sequence,
    date: normalizeString(caseItem.date),
    timestamp: caseItem.timestamp ? normalizeString(caseItem.timestamp) : undefined,
    source: normalizeString(caseItem.source),
    customerName: normalizeString(caseItem.customerName),
    status: (caseItem.status as CaseStatus) || 'Pending',
    items: normalizeCaseItems(caseItem),
    resolutionMethod: normalizeString(caseItem.resolutionMethod),
    orFilesUrls: Array.isArray(caseItem.orFilesUrls) ? caseItem.orFilesUrls : [],
    orFolderUrl: normalizeString(caseItem.orFolderUrl),
    missingBoxes: caseItem.missingBoxes !== undefined ? normalizeAmount(caseItem.missingBoxes) : undefined,
    missingGallons: caseItem.missingGallons !== undefined ? normalizeAmount(caseItem.missingGallons) : undefined,
    missingOil: caseItem.missingOil !== undefined ? normalizeAmount(caseItem.missingOil) : undefined,
    materialRequests: Array.isArray(caseItem.materialRequests) 
      ? caseItem.materialRequests 
      : (Array.isArray(caseItem.material_requests) ? caseItem.material_requests : []),
    blockedInfo: caseItem.blockedInfo || caseItem.blocked_info || undefined,
    createdByRole: normalizeString(caseItem.createdByRole || caseItem.created_by_role),
    createdByName: normalizeString(caseItem.createdByName || caseItem.created_by_name),
  }));
}

/**
 * 2. Fetch all rework cases (ดึงข้อมูล)
 */
export async function fetchAllCases(): Promise<ApiResponse<ReworkCase[]>> {
  try {
    const result = await apiFetch<ReworkCaseResponse[]>({ action: 'fetchAllCases' });

    if (result.success === false) {
      console.error('API Logic Error:', result.error);
      return { success: false, data: [], error: result.error };
    }

    return {
      success: result.success,
      data: normalizeCases(result.data || []),
      error: result.error,
    };
  } catch (error) {
    console.error('Fetch Error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch',
    };
  }
}
/**
 * 3. Update case status (อัปเดต)
 */
export async function updateCase(
  caseId: string,
  updates: Partial<ReworkCase> & { newOrFiles?: File[]; deleteItemIds?: string[]; newImages?: Record<string, File[]> }
): Promise<ApiResponse> {
  // Process OR files and item images if they exist in updates
  let allUploadedUrls: string[] = [];
  let processedOrFilesUrls: string[] = [];
  try {
    if (updates.newOrFiles && updates.newOrFiles.length > 0) {
      for (const file of updates.newOrFiles) {
        const compression = await compressImage(file, { maxSizeMB: 0.3 });
        const fileToUpload = compression.success && compression.compressedFile ? compression.compressedFile : file;
        const uploadResult = await uploadImageToCloudinary(fileToUpload);
        if (uploadResult.success && uploadResult.url) {
          processedOrFilesUrls.push(uploadResult.url);
          allUploadedUrls.push(uploadResult.url);
        }
      }
    }

    // Process new item images and removals
    const items = updates.items ? [...updates.items] : undefined;
    if (items) {
      // 1. Remove deleted images if deleteItemIds provided
      if (updates.deleteItemIds && updates.deleteItemIds.length > 0) {
        const deletedSet = new Set(updates.deleteItemIds);
        for (const item of items) {
          if (item.imageUrls && item.imageUrls.length > 0) {
            item.imageUrls = item.imageUrls.filter(url => !deletedSet.has(url));
          }
        }
      }

      // 2. Upload new staged images
      if (updates.newImages) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemKey = item.id || (item as any).uid || `idx-${i}`;
          const files = updates.newImages[itemKey] || 
                        (item.id ? updates.newImages[item.id] : undefined) || 
                        updates.newImages[`idx-${i}`] || 
                        updates.newImages[i.toString()];

          if (files && files.length > 0) {
            const newUrls: string[] = [];
            for (const file of files) {
              const compression = await compressImage(file, { maxSizeMB: 0.3 });
              const fileToUpload = compression.success && compression.compressedFile ? compression.compressedFile : file;
              const uploadResult = await uploadImageToCloudinary(fileToUpload);
              if (uploadResult.success && uploadResult.url) {
                newUrls.push(uploadResult.url);
                allUploadedUrls.push(uploadResult.url);
              }
            }
            item.imageUrls = [...(item.imageUrls || []), ...newUrls];
          }
        }
      }
    }

    // Prepare the payload, excluding the raw File objects
    const { newOrFiles, newImages, ...restUpdates } = updates;
    if (items) {
      restUpdates.items = items;
    }

    const result = await apiFetch({
      action: 'updateCaseStatus',
      caseId,
      status: updates.status,
      resolutionMethod: updates.resolutionMethod,
      performedBy: getCurrentUser()?.name || 'User',
      updates: restUpdates,
      orFilesUrls: processedOrFilesUrls.length > 0 ? processedOrFilesUrls : undefined
    });

    if (!result.success && allUploadedUrls.length > 0) {
      fetch('/api/cloudinary/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: allUploadedUrls })
      }).catch(e => console.error('Rollback API failed:', e));
    }

    return {
      success: result.success,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    if (allUploadedUrls && allUploadedUrls.length > 0) {
      fetch('/api/cloudinary/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: allUploadedUrls })
      }).catch(e => console.error('Rollback API failed:', e));
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

/**
 * 4. Fetch dashboard statistics
 */
export async function fetchDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  try {
    // We can either compute this client-side from the cases or add an API action
    // For now, let's stick to the current action if API still handles it, 
    // or we'll need to implement it in Supabase API later.
    const result = await apiFetch<DashboardStats>({ action: 'dashboardStats' });
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
    };
  }
}

/**
 * 5. Fetch item master data
 */
export async function fetchItemMaster(): Promise<ApiResponse<{ itemNumber: string, itemCode: string, itemName: string }[]>> {
  try {
    const result = await apiFetch<{ items: { itemNumber: string, itemCode: string, itemName: string }[] }>({
      action: 'loadMasterData'
    });

    const normalized = (result.data?.items || [])
      .map((item) => ({
        itemNumber: String(item?.itemNumber || '').trim(),
        itemCode: String(item?.itemCode || '').trim(),
        itemName: String(item?.itemName || '').trim(),
      }))
      .filter((item) => item.itemNumber || item.itemCode);

    return { success: result.success, data: normalized, error: result.error };
  } catch (error) {
    return { success: false, data: [], error: 'Failed to fetch item master' };
  }
}

/**
 * 6. Save new item to itemMaster sheet if not exists
 */
export async function saveItemToMaster(itemNumber: string, itemCode: string, itemName: string): Promise<ApiResponse> {
  try {
    const result = await apiFetch({
      action: 'saveItemMaster', // This will still proxy to API for now unless we add it to Supabase API
      itemNumber: String(itemNumber || '').trim(),
      itemCode: String(itemCode || '').trim(),
      itemName: String(itemName || '').trim(),
    });
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save item master',
    };
  }
}

/**
 * 8. Upload a single image to storage
 */
export async function uploadItemImage(fileName: string, base64Data: string): Promise<ApiResponse<{ url: string }>> {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
       return {
         success: false,
         error: 'Cloudinary configuration missing'
       };
    }
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    // Ensure base64Data includes data prefix if it doesn't already
    const prefix = base64Data.startsWith('data:') ? '' : 'data:image/jpeg;base64,';
    const uploadData = prefix + base64Data;

    const formData = new FormData();
    formData.append('file', uploadData);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'qsms_rework_evidence');
    formData.append('public_id', fileName.split('.')[0]); // Use filename without extension as public_id

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: { url: result.secure_url }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image upload failed',
    };
  }
}

export async function fetchImageDataUrl(imageUrl: string): Promise<string> {
  return imageUrl;
}

/**
 * 7. Delete a rework case
 */
export async function deleteCase(caseId: string): Promise<ApiResponse> {
  try {
    const result = await apiFetch({
      action: 'deleteCase',
      caseId,
    });

    return {
      success: result.success,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}
