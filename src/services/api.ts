/**
 * API Service for Google Apps Script Integration
 * Includes authentication and authorization
 */

import { getCurrentUser, getToken } from './auth';
import { compressImage } from '../utils/imageCompressionUtils';

// GAS URL is managed securely server-side, local wrapper handles backward-compatibility
let GAS_WEB_APP_URL = '';

export function setGasWebAppUrl(url: string): void {
  GAS_WEB_APP_URL = url;
}

export function getGasWebAppUrl(): string {
  return GAS_WEB_APP_URL;
}

function isValidGasUrl(url: string): boolean {
  return !url || (url.includes('script.google.com/macros/s') && url.endsWith('/exec'));
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  details?: Array<{ itemIndex: number; errors: string[] }>;
}

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
  imageFolderUrl?: string; // URL ของ folder ใน Google Drive ที่เก็บรูปทั้งหมดของ case นี้
  status?: 'Pending' | 'In-Progress' | 'Awaiting Valuation' | 'Completed';
  batchNo?: string;
  gallonDate?: string;
  boxNumber?: string;
  packagingDate?: string;
  mold?: string;
  line?: string;
  linkedSourceId?: string;
  customerName?: string;
  imageCount?: number;
  uid?: string; // Stable unique ID from backend
  lastActiveField?: 'itemNumber' | 'itemCode'; // Tracks user priority
  verificationStatus?: 'idle' | 'checking' | 'verified' | 'new' | 'failed' | 'updating' | 'conflict';
}

export const CUSTOMER_OPTIONS = [
  'Eneos',
  'Valvaline',
  'BCP',
  'OR',
  'Petronas',
  'Others',
];

export interface MaterialUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ReworkCase {
  id: string;
  caseName?: string;
  date: string;
  timestamp?: string;
  source: string;
  customerName?: string;
  status: 'Pending' | 'In-Progress' | 'Awaiting Valuation' | 'Completed';
  items: ReworkItem[];
  resolutionMethod?: string;
  reworkCost?: number;
  orFilesUrls?: string[];
  orFolderUrl?: string;
  materials?: MaterialUsage[];
  laborCount?: number;
  laborHours?: number;
  laborRate?: number;
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

async function postToGas<T>(payload: Record<string, unknown>): Promise<ApiResponse<T>> {
  // Verify user is authenticated
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  try {
    const currentUser = getCurrentUser();
    const tokenPayload = parseTokenPayload(token);
    // CRITICAL: Must use ROLE (ADMIN, PDB, etc.) not Name for authProfile
    const authProfile = String(tokenPayload?.profile || currentUser?.role || '').trim().toUpperCase();
    const authEmail = currentUser?.email
      ? String(currentUser.email).trim()
      : String(tokenPayload?.sub || '').trim();

    // Call our server-side Next.js secure API Proxy
    const response = await fetch('/api/rework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        token,
        authProfile,
        authEmail,
        userRole: currentUser?.role || '' // Include userRole for backend validation
      }),
    });

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Network response was not ok (${response.status})`);
      } catch (e) {
        if (e instanceof Error && e.message !== `Network response was not ok (${response.status})`) {
          throw e;
        }
        throw new Error(`Network response was not ok (${response.status})`);
      }
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
  customCaseId?: string
): Promise<ApiResponse<{ caseId: string; itemIds: string[] }>> {
  try {
    // แปลงไฟล์รูปภาพทั้งหมดเป็น Base64 ก่อนส่ง (เพื่อให้ GAS.txt รับได้)
    const processedItems = await Promise.all(items.map(async (item) => {
      const files = imageData && imageData[item.id] ? imageData[item.id] : [];

      const base64Images = await Promise.all(files.map(async (file) => {
        const compression = await compressImage(file, { maxSizeMB: 0.3 }); // Target 300KB
        const fileToConvert = compression.success ? compression.compressedFile! : file;
        return await fileToBase64(fileToConvert);
      }));

      console.log(`📸 Processing images for ${item.itemNumber}:`, {
        itemId: item.id,
        fileCount: files.length,
        base64Count: base64Images.length,
        sampleBase64: base64Images[0]?.substring(0, 50) || 'none'
      });

      return {
        id: item.id,
        itemNumber: item.itemNumber,
        itemName: item.itemName,
        itemCode: item.itemCode,
        amount: item.amount,
        reason: item.reason,
        reasonSubtype: item.reasonSubtype || '',
        responsible: item.responsible,
        responsibleSubtype: item.responsibleSubtype || '',
        details: item.details || '',
        batchNo: item.batchNo || '',
        packagingDate: item.packagingDate || '',
        mold: item.mold || '',
        line: item.line || '',
        linkedSourceId: item.linkedSourceId || '',
        customerName: item.customerName || '',
        images: base64Images // ส่งเป็น Array ของ string (base64)
      };
    }));

    // Use custom Case ID if provided, otherwise fallback to auto-generated timestamp ID
    const caseId = customCaseId || `RW${new Date().toISOString().replace(/[-:T.Z]/g, '').substring(2, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    console.log('📦 Sending case to GAS:', {
      source,
      caseId,
      itemCount: processedItems.length,
      totalImages: processedItems.reduce((sum, item) => sum + item.images.length, 0),
      orFilesCount: orFiles?.length || 0
    });

    // Convert OR files to base64 if any
    const processedOrFiles = orFiles
      ? await Promise.all(orFiles.map(fileToBase64))
      : [];

    const result = await postToGas<{ caseId: string; itemIds: string[] }>({
      action: 'insertCase',
      caseData: {
        id: caseId,
        date: new Date().toISOString().split('T')[0],
        source,
        profileId: getCurrentUser()?.name || 'User',
        items: processedItems,
        orFiles: processedOrFiles
      }
    });

    if (result.success) {
      console.log('✓ Case inserted successfully:', result.data);
    } else {
      console.error('✗ Case insertion failed:', result.error);
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
    };
  });
}

function normalizeCases(cases: ReworkCaseResponse[]): ReworkCase[] {
  return cases.map((caseItem) => ({
    id: normalizeString(caseItem.id),
    caseName: caseItem.caseName ? normalizeString(caseItem.caseName) : undefined,
    date: normalizeString(caseItem.date),
    timestamp: caseItem.timestamp ? normalizeString(caseItem.timestamp) : undefined,
    source: normalizeString(caseItem.source),
    customerName: normalizeString(caseItem.customerName),
    status: caseItem.status || 'Pending',
    items: normalizeCaseItems(caseItem),
    resolutionMethod: normalizeString(caseItem.resolutionMethod),
    reworkCost: normalizeAmount(caseItem.reworkCost),
    orFilesUrls: Array.isArray(caseItem.orFilesUrls) ? caseItem.orFilesUrls : [],
    orFolderUrl: normalizeString(caseItem.orFolderUrl),
    materials: Array.isArray(caseItem.materials) ? caseItem.materials.map(m => ({
      id: normalizeString(m.id),
      name: normalizeString(m.name),
      quantity: normalizeAmount(m.quantity),
      unit: normalizeString(m.unit),
      unitPrice: m.unitPrice !== undefined ? normalizeAmount(m.unitPrice) : undefined,
      totalPrice: m.totalPrice !== undefined ? normalizeAmount(m.totalPrice) : undefined,
    })) : [],
    laborCount: caseItem.laborCount !== undefined ? normalizeAmount(caseItem.laborCount) : undefined,
    laborHours: caseItem.laborHours !== undefined ? normalizeAmount(caseItem.laborHours) : undefined,
    laborRate: caseItem.laborRate !== undefined ? normalizeAmount(caseItem.laborRate) : undefined,
  }));
}

/**
 * 2. Fetch all rework cases (ดึงข้อมูล)
 */
export async function fetchAllCases(): Promise<ApiResponse<ReworkCase[]>> {
  try {
    const result = await postToGas<ReworkCaseResponse[]>({ action: 'fetchAllCases' });

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
  updates: Partial<ReworkCase> & { newOrFiles?: File[]; deleteItemIds?: string[] }
): Promise<ApiResponse> {
  try {
    // Process OR files if they exist in updates
    let processedOrFiles: string[] = [];
    if (updates.newOrFiles && updates.newOrFiles.length > 0) {
      processedOrFiles = await Promise.all(updates.newOrFiles.map(async (file) => {
        const compression = await compressImage(file, { maxSizeMB: 0.3 });
        const fileToConvert = compression.success ? compression.compressedFile! : file;
        return await fileToBase64(fileToConvert);
      }));
    }

    // Prepare the payload, excluding the raw File objects
    const { newOrFiles, ...restUpdates } = updates;

    const result = await postToGas({
      action: 'updateCaseStatus',
      caseId,
      status: updates.status,
      resolutionMethod: updates.resolutionMethod,
      reworkCost: updates.reworkCost,
      performedBy: getCurrentUser()?.name || 'User',
      updates: restUpdates,
      orFiles: processedOrFiles.length > 0 ? processedOrFiles : undefined
    });

    return {
      success: result.success,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
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
    // For now, let's stick to the current action if GAS still handles it, 
    // or we'll need to implement it in Supabase API later.
    const result = await postToGas<DashboardStats>({ action: 'dashboardStats' });
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
    const result = await postToGas<{ items: { itemNumber: string, itemCode: string, itemName: string }[] }>({
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
    const result = await postToGas({
      action: 'saveItemMaster', // This will still proxy to GAS for now unless we add it to Supabase API
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

export async function fetchImageDataUrl(imageUrl: string): Promise<string> {
  return imageUrl;
}

/**
 * 7. Delete a rework case
 */
export async function deleteCase(caseId: string): Promise<ApiResponse> {
  try {
    const result = await postToGas({
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
