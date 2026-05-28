/**
 * INTEGRATION GUIDE: Image Upload with Compression
 * 
 * This file shows how to integrate the improved ImageUpload component
 * with compression and upload progress into your existing components.
 */

/**
 * STEP 1: Import the necessary components and utilities
 */
import { ImageUpload } from './components/ImageUpload';
import { UploadProgress } from './components/UploadProgress';
import {
  uploadMultipleImagesToGAS,
  validateUploadFile,
} from './services/imageUploadService';

/**
 * STEP 2: Add state management for compressed images
 */
interface CaseFormState {
  itemData: any;
  compressedImages: File[]; // Store compressed files
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'complete' | 'error';
  uploadError?: string;
}

/**
 * STEP 3: Update AddCaseTab Component
 * 
 * Example integration (pseudo-code showing key changes):
 */
export function AddCaseTabWithImageUpload() {
  // Add these state variables
  const [compressedImages, setCompressedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>();

  /**
   * Handle compressed images from ImageUpload component
   */
  const handleImagesCompressed = (files: File[]) => {
    console.log('Compressed images ready:', files);
    setCompressedImages(files);

    // Optional: Auto-upload if needed
    // handleUploadImages(files);
  };

  /**
   * Handle image upload to Google Apps Script
   */
  const handleUploadImages = async (files: File[]) => {
    if (files.length === 0) {
      setUploadError('No images to upload');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(undefined);

    try {
      // Get GAS URL from your configuration
      const gasUrl = window.location.href; // Or from config
      
      const results = await uploadMultipleImagesToGAS(
        files,
        gasUrl,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Check for errors
      const errors = results.filter((r) => !r.success);
      if (errors.length > 0) {
        setUploadError(
          `${errors.length} file(s) failed to upload`
        );
        setUploadStatus('error');
        return;
      }

      // All successful
      const imageUrls = results
        .filter((r) => r.success)
        .map((r) => r.url as string);

      console.log('Upload successful! Image URLs:', imageUrls);
      setUploadStatus('complete');
      setUploadProgress(100);

      // Save to GAS with case data
      await saveItemWithImages(itemData, imageUrls);
    } catch (error) {
      setUploadStatus('error');
      setUploadError(
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  };

  /**
   * Save item with image URLs to Google Apps Script
   */
  const saveItemWithImages = async (itemData: any, imageUrls: string[]) => {
    try {
      const payload = {
        action: 'createItem',
        item: {
          ...itemData,
          imageUrls: imageUrls, // Add image URLs to item
        },
      };

      // Send to GAS
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Item saved successfully');
        // Clear form
        setCompressedImages([]);
      }
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing form fields... */}

      {/* NEW: Image Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4">ส่วน: รูปภาพประกอบ</h3>
        
        <ImageUpload
          itemIndex={0}
          onImagesSelected={(files) => {
            console.log('Raw files selected:', files);
            // Optional: do something with raw files
          }}
          onImagesCompressed={handleImagesCompressed}
          maxImages={5}
          maxSizeMB={0.5}
          maxWidthOrHeight={1280}
        />

        {/* Upload Progress */}
        {uploadStatus !== 'idle' && (
          <div className="mt-6">
            <UploadProgress
              progress={uploadProgress}
              status={uploadStatus}
              message={
                uploadStatus === 'uploading'
                  ? 'Uploading images to server...'
                  : uploadStatus === 'complete'
                  ? 'All images uploaded successfully!'
                  : uploadStatus === 'error'
                  ? 'Upload failed'
                  : ''
              }
              error={uploadError}
            />
          </div>
        )}

        {/* Upload Button */}
        {compressedImages.length > 0 && uploadStatus === 'idle' && (
          <button
            onClick={() => handleUploadImages(compressedImages)}
            className="mt-4 px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all"
          >
            Upload {compressedImages.length} Image(s)
          </button>
        )}
      </div>

      {/* Existing form submit button... */}
    </div>
  );
}

/**
 * STEP 4: Complete Form Submission with Images
 * 
 * Example of how to submit the entire form with image URLs:
 */
export async function handleFormSubmit(formData: any, imageUrls: string[]) {
  const casePayload = {
    action: 'createReworkCase',
    case: {
      date: new Date().toISOString(),
      source: formData.source,
      status: 'Pending',
      items: [
        {
          ...formData.item,
          imageUrls: imageUrls, // Include image URLs
        },
      ],
    },
  };

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(casePayload),
  });

  const result = await response.json();
  return result;
}

/**
 * STEP 5: Error Handling Examples
 */
export const ErrorHandlingExamples = {
  /**
   * Handle validation errors
   */
  handleValidationError: (error: string) => {
    if (error.includes('Invalid file type')) {
      console.log('Show: "Please use JPG or PNG images only"');
    } else if (error.includes('File too large')) {
      console.log('Show: "File exceeds size limit. Please try a smaller file."');
    }
  },

  /**
   * Handle compression errors
   */
  handleCompressionError: (error: string) => {
    console.error('Compression failed:', error);
    // Show retry button in UI
  },

  /**
   * Handle upload errors
   */
  handleUploadError: (error: string) => {
    if (error.includes('Failed to fetch')) {
      console.log('Show: "Network error. Check your connection."');
    } else if (error.includes('Session expired')) {
      console.log('Show: "Session expired. Please log in again."');
    } else {
      console.log('Show:', error);
    }
  },
};

/**
 * STEP 6: Data Flow Diagram
 * 
 * User selects image(s)
 *           ↓
 * FileReader creates preview
 *           ↓
 * Validation (type, size, extension)
 *           ↓
 * Compression starts (with progress)
 *           ↓
 * Compressed file ready (show checkmark)
 *           ↓
 * User clicks "Upload"
 *           ↓
 * Convert to Base64 (with progress)
 *           ↓
 * Send to GAS
 *           ↓
 * GAS stores in Drive & returns URL
 *           ↓
 * Save item with image URLs
 */

/**
 * STEP 7: Configuration
 * 
 * To customize compression settings, pass props to ImageUpload:
 * 
 * Default:
 * - maxImages: 5
 * - maxSizeMB: 0.5 (500KB)
 * - maxWidthOrHeight: 1280px
 * 
 * Override example:
 * <ImageUpload
 *   itemIndex={0}
 *   onImagesCompressed={handleCompressed}
 *   maxImages={10}
 *   maxSizeMB={1.0}
 *   maxWidthOrHeight={2048}
 * />
 */

/**
 * STEP 8: Advanced: Auto-Upload on Compression Complete
 * 
 * If you want to auto-upload images as soon as compression completes:
 */
export const AutoUploadExample = {
  handleImagesCompressed: async (files: File[], gasUrl: string) => {
    // Auto-trigger upload
    const results = await uploadMultipleImagesToGAS(files, gasUrl);
    
    if (results.every(r => r.success)) {
      console.log('All images uploaded automatically!');
    }
  },
};

/**
 * STEP 9: Accessibility & UX Improvements
 * 
 * Already included in components:
 * ✅ Keyboard navigation support
 * ✅ ARIA labels for screen readers
 * ✅ Meaningful error messages
 * ✅ Visual feedback (spinners, checkmarks)
 * ✅ Progress bars with percentage
 * ✅ Disabled states during processing
 * ✅ Mobile-responsive design
 */

/**
 * STEP 10: Testing Checklist
 * 
 * - [ ] Upload single image
 * - [ ] Upload multiple images (2-5)
 * - [ ] Compression shows progress
 * - [ ] File size reduction displays
 * - [ ] Upload shows progress
 * - [ ] Success message appears
 * - [ ] Error handling shows proper message
 * - [ ] Retry button works after error
 * - [ ] Remove image works
 * - [ ] Max images limit enforced
 * - [ ] Works on mobile
 * - [ ] Works on slow connection
 * - [ ] Integration with form submission works
 */
