/**
 * Image Upload Service
 * Handles uploading compressed images to Google Apps Script with progress tracking
 */

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a single image file to Google Apps Script
 * @param file - The file to upload
 * @param gasUrl - Google Apps Script web app URL
 * @param onProgress - Callback for progress updates
 * @returns Upload result
 */
export async function uploadImageToGAS(
  file: File,
  gasUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    if (!gasUrl) {
      return {
        success: false,
        error: 'GAS URL not configured',
      };
    }

    // Convert file to base64
    const base64 = await fileToBase64(file, onProgress);

    // Send to GAS
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'uploadImage',
        imageData: base64,
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed with status ${response.status}`,
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.url,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error from server',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple images to Google Apps Script
 * @param files - Array of files to upload
 * @param gasUrl - Google Apps Script web app URL
 * @param onProgress - Callback for overall progress updates
 * @returns Array of upload results
 */
export async function uploadMultipleImagesToGAS(
  files: File[],
  gasUrl: string,
  onProgress?: (progress: { fileIndex: number; percentage: number }) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImageToGAS(files[i], gasUrl, () => {
      onProgress?.({ fileIndex: i, percentage: Math.floor(((i + 1) / files.length) * 100) });
    });
    results.push(result);
  }

  return results;
}

/**
 * Convert file to base64 with progress tracking
 * @param file - The file to convert
 * @param onProgress - Callback for progress updates
 * @returns Base64 encoded string
 */
async function fileToBase64(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.floor((event.loaded / event.total) * 100),
        });
      }
    };

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Create a FormData object for multipart upload
 * @param file - The file to upload
 * @returns FormData object
 */
export function createImageFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('fileName', file.name);
  formData.append('fileType', file.type);
  return formData;
}

/**
 * Validate if file is safe for upload
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 1 * 1024 * 1024; // 1MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: JPEG, PNG`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: 1MB`,
    };
  }

  return { valid: true };
}
