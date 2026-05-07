/**
 * API Service for Google Apps Script Integration
 * Includes authentication and authorization
 */

import { getCurrentUser, getToken } from './auth';

// ⚠️ GAS URL ต้องถูกตั้งค่าจาก App.tsx หรือ environment
const envGasUrl = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();
let GAS_WEB_APP_URL = envGasUrl;

export function setGasWebAppUrl(url: string): void {
  const normalizedUrl = String(url || '').trim();
  if (isValidGasUrl(normalizedUrl)) {
    GAS_WEB_APP_URL = normalizedUrl;
  } else {
    console.warn('Invalid GAS Web App URL set:', url);
  }
}

export function getGasWebAppUrl(): string {
  return GAS_WEB_APP_URL;
}

function isValidGasUrl(url: string): boolean {
  return url.includes('script.google.com/macros/s') && url.endsWith('/exec');
}

function ensureGasWebAppUrl() {
  if (!isValidGasUrl(GAS_WEB_APP_URL)) {
    throw new Error('REACT_APP_GAS_WEB_APP_URL is not configured with a valid Google Apps Script /exec URL.');
  }
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
  status?: 'Pending' | 'In-Progress' | 'Completed';
}

export interface ReworkCase {
  id: string;
  date: string;
  source: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  items: ReworkItem[];
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
  ensureGasWebAppUrl();

  // Verify user is authenticated
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  try {
    const currentUser = getCurrentUser();
    const tokenPayload = parseTokenPayload(token);
    const authProfile = String(tokenPayload?.profile || currentUser?.name || '').trim();
    const authEmail = currentUser?.email
      ? String(currentUser.email).trim()
      : String(tokenPayload?.sub || '').trim();

    // Send request WITHOUT extra auth headers to avoid preflight OPTIONS
    // GAS doesn't support preflight properly, so keep it simple
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ ...payload, token, authProfile, authEmail }), // Include auth context for backend validation
    });

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`Network response was not ok (${response.status})`);
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (!result.success && result.statusCode === 401) {
      throw new Error(result.error || 'Session expired. Please login again.');
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // This is likely a CORS error
      console.error('❌ CORS Error - GAS endpoint may not be configured for cross-origin requests');
      console.error('📝 Make sure the GAS deployment allows CORS from this origin');
      console.error('🔗 GAS URL:', GAS_WEB_APP_URL);
      throw new Error('Cannot connect to GAS backend. Please verify the deployment URL is correct and CORS is enabled.');
    }
    throw error;
  }
}

/**
 * 1. Insert a new rework case (แก้ไขการส่งเป็น JSON + Base64 Images)
 */
export async function insertCase(
  source: string,
  items: ReworkItem[],
  imageData?: Record<string, File[]>
): Promise<ApiResponse<{ caseId: string; itemIds: string[] }>> {
  try {
    // แปลงไฟล์รูปภาพทั้งหมดเป็น Base64 ก่อนส่ง (เพื่อให้ GAS.txt รับได้)
    const processedItems = await Promise.all(items.map(async (item) => {
      const base64Images = imageData && imageData[item.id]
        ? await Promise.all(imageData[item.id].map(fileToBase64))
        : [];

      console.log(`📸 Processing images for ${item.itemNumber}:`, {
        itemId: item.id,
        fileCount: imageData?.[item.id]?.length || 0,
        base64Count: base64Images.length,
        sampleBase64: base64Images[0]?.substring(0, 50) || 'none'
      });

      return {
        itemNumber: item.itemNumber,
        itemName: item.itemName,
        itemCode: item.itemCode,
        amount: item.amount,
        reason: item.reason,
        reasonSubtype: item.reasonSubtype || '',
        responsible: item.responsible,
        responsibleSubtype: item.responsibleSubtype || '',
        details: item.details || '',
        images: base64Images // ส่งเป็น Array ของ string (base64)
      };
    }));

    console.log('📦 Sending case to GAS:', {
      source,
      itemCount: processedItems.length,
      totalImages: processedItems.reduce((sum, item) => sum + item.images.length, 0)
    });

    const result = await postToGas<{ caseId: string; itemIds: string[] }>({
      action: 'insert',
      source,
      items: processedItems,
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
    const imageUrls = Array.isArray(item.imageUrls)
      ? item.imageUrls
      : Array.isArray(item.urls)
        ? item.urls
        : item.url
          ? [normalizeString(item.url)]
          : [];

    return {
      id: createNormalizedItemId(caseItem.id, item, index, seenIds),
      itemNumber: normalizeString(item.itemNumber),
      itemName: normalizeString(item.itemName),
      itemCode: normalizeString(item.itemCode),
      amount: normalizeAmount(item.amount),
      reason: normalizeString(item.reason),
      reasonSubtype: normalizeString(item.reasonSubtype),
      responsible: normalizeString(item.responsible),
      responsibleSubtype: normalizeString(item.responsibleSubtype),
      details: normalizeString(item.details),
      status: item.status || caseItem.status || 'Pending',
      imageUrls,
      imageFolderUrl: normalizeString(item.imageFolderUrl),
    };
  });
}

function normalizeCases(cases: ReworkCaseResponse[]): ReworkCase[] {
  return cases.map((caseItem) => ({
    id: normalizeString(caseItem.id),
    date: normalizeString(caseItem.date),
    source: normalizeString(caseItem.source),
    status: caseItem.status || 'Pending',
    items: normalizeCaseItems(caseItem),
  }));
}

/**
 * 2. Fetch all rework cases (ดึงข้อมูล)
 */
export async function fetchAllCases(): Promise<ApiResponse<ReworkCase[]>> {
  try {
    const result = await postToGas<ReworkCaseResponse[]>({ action: 'readAll' });

    if (result.success === false) {
      console.error('GAS Logic Error:', result.error);
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
  updates: Partial<ReworkCase>
): Promise<ApiResponse> {
  try {
    const result = await postToGas({
      action: 'update',
      caseId,
      updates,
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
export async function fetchItemMaster(): Promise<ApiResponse<{ itemNumber: string, itemName: string }[]>> {
  try {
    const result = await postToGas<{ itemNumber: string, itemName: string }[]>({ action: 'getItemMaster' });
    const normalized = (result.data || [])
      .map((item) => {
        const itemNumber = String(item?.itemNumber || '').trim();
        const rawName = String(item?.itemName || '').trim();
        return {
          itemNumber,
          itemName: rawName || itemNumber,
        };
      })
      .filter((item) => item.itemNumber);

    return { success: result.success, data: normalized, error: result.error };
  } catch (error) {
    return { success: false, data: [], error: 'Failed to fetch item master' };
  }
}

/**
 * 6. Save new item to itemMaster sheet if not exists
 */
export async function saveItemToMaster(itemNumber: string, itemName: string): Promise<ApiResponse> {
  try {
    const normalizedItemNumber = String(itemNumber || '').trim();
    const normalizedItemName = String(itemName || '').trim();

    const result = await postToGas({
      action: 'saveItemMaster',
      itemNumber: normalizedItemNumber,
      itemName: normalizedItemName,
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
  const normalizedUrl = String(imageUrl || '').trim();
  if (!normalizedUrl) return '';
  if (normalizedUrl.startsWith('data:')) return normalizedUrl;

  const cached = imageDataUrlCache.get(normalizedUrl);
  if (cached) return cached;

  const result = await postToGas<{ dataUrl: string }>({
    action: 'getImageDataUrl',
    imageUrl: normalizedUrl,
  });

  if (!result.success || !result.data?.dataUrl) {
    throw new Error(result.error || 'Failed to load image');
  }

  imageDataUrlCache.set(normalizedUrl, result.data.dataUrl);
  return result.data.dataUrl;
}
