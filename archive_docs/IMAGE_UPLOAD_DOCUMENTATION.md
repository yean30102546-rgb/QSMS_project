# Image Upload & Compression System Documentation

## Overview

This document explains the improved image upload and compression system for the QSMS Rework project. The system includes:

- ✅ Client-side image compression using `browser-image-compression`
- ✅ File validation (JPEG, PNG only)
- ✅ Real-time compression progress feedback
- ✅ Upload progress tracking
- ✅ Automatic status indicators (Processing → Complete/Error)
- ✅ Compression statistics (size reduction %)

---

## Architecture

### Components & Services

```
ImageUpload.tsx (Main Component)
├── Uses: imageCompressionUtils.ts (Compression Logic)
├── Uses: imageUploadService.ts (GAS Integration)
└── Uses: UploadProgress.tsx (Progress Display)

Services:
├── imageCompressionUtils.ts - Image compression & validation
├── imageUploadService.ts - Upload to Google Apps Script
└── api.ts - General API integration
```

---

## Key Files

### 1. **ImageUpload Component** (`src/components/ImageUpload.tsx`)

Main component handling image selection, compression, and display.

#### Props:

```typescript
interface ImageUploadProps {
  itemIndex: number;                          // Index of item
  onImagesSelected: (files: File[]) => void;  // Callback when raw files selected
  onImagesCompressed?: (compressedFiles: File[]) => void; // Callback with compressed files
  maxImages?: number;                         // Max files (default: 5)
  maxSizeMB?: number;                         // Max size in MB (default: 0.5)
  maxWidthOrHeight?: number;                  // Max dimension (default: 1280)
}
```

#### Features:

- **Drag & Drop Support**: Intuitive file upload
- **Auto-Compression**: Starts automatically after preview creation
- **Visual Feedback**: 
  - Processing spinner during compression
  - ✅ Checkmark on success
  - ❌ Error indicator on failure
- **Statistics Panel**: Shows compressed/processing/failed counts
- **File Size Display**: Shows before/after compression
- **Error Handling**: Retry button for failed compressions
- **Compression Summary**: Total size reduction percentage

#### Usage Example:

```tsx
import { ImageUpload } from './components/ImageUpload';

function MyComponent() {
  const [compressedImages, setCompressedImages] = useState<File[]>([]);

  return (
    <ImageUpload
      itemIndex={0}
      onImagesSelected={(files) => console.log('Selected:', files)}
      onImagesCompressed={(files) => setCompressedImages(files)}
      maxImages={5}
      maxSizeMB={0.5}
      maxWidthOrHeight={1280}
    />
  );
}
```

---

### 2. **Image Compression Utility** (`src/utils/imageCompressionUtils.ts`)

Handles all compression logic and validation.

#### Key Functions:

#### `validateImageFile(file: File): ValidationResult`

Validates file type and initial size.

```typescript
const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

**Checks:**
- File type: JPEG or PNG only
- File extension: .jpg, .jpeg, .png
- Initial size: Max 10MB

---

#### `compressImage(file, config, onProgress): CompressionResult`

Compresses a single image with progress tracking.

```typescript
const result = await compressImage(
  file,
  { maxSizeMB: 0.5, maxWidthOrHeight: 1280 },
  (progress) => console.log(`Progress: ${progress}%`)
);

if (result.success) {
  console.log(`Compressed: ${result.originalSize} → ${result.compressedSize}`);
  // Use result.compressedFile
}
```

**Default Config:**
```typescript
{
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280
}
```

---

#### `formatFileSize(bytes: number): string`

Converts bytes to human-readable format.

```typescript
formatFileSize(1536); // Returns: "1.5 KB"
formatFileSize(1048576); // Returns: "1 MB"
```

---

#### `calculateCompressionRatio(originalSize, compressedSize): number`

Calculates compression percentage.

```typescript
const ratio = calculateCompressionRatio(1000000, 500000);
console.log(ratio); // Returns: 50
```

---

### 3. **Upload Service** (`src/services/imageUploadService.ts`)

Handles uploading to Google Apps Script with progress tracking.

#### Key Functions:

#### `uploadImageToGAS(file, gasUrl, onProgress): Promise<UploadResult>`

Uploads single image to GAS.

```typescript
const result = await uploadImageToGAS(
  compressedFile,
  'https://script.google.com/macros/s/YOUR_ID/exec',
  (progress) => {
    console.log(`Uploaded: ${progress.percentage}%`);
  }
);

if (result.success) {
  console.log('Image URL:', result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

---

#### `uploadMultipleImagesToGAS(files, gasUrl, onProgress): Promise<UploadResult[]>`

Uploads multiple images.

```typescript
const results = await uploadMultipleImagesToGAS(
  compressedFiles,
  gasUrl,
  (progress) => {
    console.log(`File ${progress.fileIndex}: ${progress.percentage}%`);
  }
);
```

---

### 4. **Upload Progress Component** (`src/components/UploadProgress.tsx`)

Displays upload/compression progress with visual feedback.

#### Props:

```typescript
interface UploadProgressProps {
  progress: number;           // 0-100
  status: 'idle' | 'processing' | 'uploading' | 'complete' | 'error';
  message?: string;
  error?: string;
  fileName?: string;
  showPercentage?: boolean;   // default: true
}
```

#### Usage:

```tsx
<UploadProgress
  progress={85}
  status="uploading"
  message="Uploading image..."
  fileName="photo.jpg"
/>
```

---

## Implementation Pattern

### Step 1: Add ImageUpload Component

```tsx
import { ImageUpload } from '../components/ImageUpload';

export function AddCaseTab() {
  const [compressedImages, setCompressedImages] = useState<File[]>([]);

  return (
    <ImageUpload
      itemIndex={0}
      onImagesSelected={(files) => {
        console.log('Raw files selected:', files);
      }}
      onImagesCompressed={(files) => {
        setCompressedImages(files);
        console.log('Compressed files ready:', files);
      }}
      maxImages={5}
    />
  );
}
```

### Step 2: Handle Compressed Files

```tsx
import { uploadMultipleImagesToGAS } from '../services/imageUploadService';

async function handleUpload() {
  const results = await uploadMultipleImagesToGAS(
    compressedImages,
    gasUrl,
    (progress) => {
      console.log(`Upload: ${progress.percentage}%`);
    }
  );

  const urls = results
    .filter(r => r.success)
    .map(r => r.url);

  // Send to GAS with item data
  await saveItemWithImages(itemData, urls);
}
```

---

## Configuration

### Default Compression Settings

Located in `imageCompressionUtils.ts`:

```typescript
const DEFAULT_CONFIG = {
  maxSizeMB: 0.5,              // 500KB max
  maxWidthOrHeight: 1280,      // 1280px max dimension
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
```

### Customization

Override defaults when calling component:

```tsx
<ImageUpload
  itemIndex={0}
  onImagesSelected={handleSelect}
  onImagesCompressed={handleCompressed}
  maxImages={10}              // Change max files
  maxSizeMB={1.0}             // Change max size
  maxWidthOrHeight={2048}     // Change max dimensions
/>
```

---

## UI/UX Features

### Fixed Pagination (Already Implemented)

The OverallTab component now uses:

```tsx
<div className="glass-card p-2 bg-white flex flex-col h-full min-h-[600px]">
  {/* Content with flex-1 */}
  
  {/* Pagination stays at bottom with sticky */}
  {totalPages > 1 && (
    <div className="sticky bottom-0 border-t bg-slate-50/50">
      {/* Pagination controls */}
    </div>
  )}
</div>
```

### Image Upload Status Display

**During Compression:**
```
⏳ Processing... (shows spinner)
[████░░░░░░░░░░░] 40%
```

**After Compression:**
```
✅ Complete (shows checkmark)
2.5 MB → 0.48 MB (-80%)
```

**On Error:**
```
❌ Error: Invalid file type
[Retry] button
```

### Statistics Panel

Shows real-time counts:
- 🟦 Compressed: 3 files
- 🟨 Processing: 1 file
- 🟥 Failed: 0 files

---

## Error Handling

### Validation Errors

Files are validated for:
1. **Type Check**: Only JPEG/PNG allowed
2. **Extension Check**: Must be .jpg, .jpeg, or .png
3. **Size Check**: Max 10MB before compression

Error message example:
```
❌ Invalid file type: image/gif. Only JPEG and PNG are allowed.
```

### Compression Errors

If compression fails, user can:
1. Retry compression via [Retry] button
2. Remove and try different file
3. Check file integrity

---

## Performance Considerations

### Browser Compression Benefits

✅ **Faster Upload**: Reduces file size by 80-90%
✅ **Bandwidth Savings**: Less data to transfer
✅ **No Server Load**: Compression happens on client
✅ **Better UX**: Progress feedback during compression
✅ **Flexible Config**: Adjustable quality/size tradeoff

### Web Worker

The compression uses Web Worker by default:
```typescript
useWebWorker: true  // Non-blocking compression
```

This prevents UI freezing during large image compression.

---

## Typical Workflow

1. **User selects images** → Drag & drop or click upload
2. **Preview created** → Shows thumbnail instantly
3. **Auto-compression starts** → Shows progress spinner
4. **Status updates** → Shows % complete
5. **Compression complete** → ✅ checkmark + size info
6. **Ready to upload** → Can send to GAS
7. **Upload to GAS** → Shows upload progress
8. **Success/Error** → Handles results

---

## Integration with Google Apps Script

### GAS Endpoint Requirements

Your GAS script should handle:

```javascript
// doPost function in GAS
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  
  if (payload.action === 'uploadImage') {
    const imageData = payload.imageData;  // Base64
    const fileName = payload.fileName;
    const fileType = payload.fileType;
    
    // Store image in Google Drive
    // Return: { success: true, url: '...' }
  }
}
```

---

## Clean Code Principles

### Component Structure

✅ Single Responsibility: Each component has one job
✅ Props Interface: Clear, typed component interface
✅ Custom Hooks: Compression logic in utilities
✅ Error Boundaries: Graceful error handling
✅ Performance: Uses memoization, callbacks, Web Workers

### File Organization

```
src/
├── components/
│   ├── ImageUpload.tsx          # UI Component
│   └── UploadProgress.tsx       # Progress Display
├── utils/
│   └── imageCompressionUtils.ts # Compression Logic
└── services/
    └── imageUploadService.ts    # GAS Integration
```

---

## Testing Checklist

- [ ] Select single image
- [ ] Select multiple images (up to max)
- [ ] Drag and drop images
- [ ] Compression progress shows
- [ ] File size reduction displays correctly
- [ ] Remove image works
- [ ] Retry failed compression
- [ ] Reach max images limit
- [ ] Invalid file type rejected
- [ ] File size validation works
- [ ] Upload to GAS succeeds
- [ ] Upload progress tracking works

---

## Common Issues & Solutions

### Issue: Images not compressing

**Solution**: Check if `browser-image-compression` is installed:
```bash
npm install browser-image-compression
```

### Issue: Compression takes too long

**Solution**: Web Worker enabled by default, but check network bandwidth.

### Issue: Upload fails

**Solution**: Verify GAS URL is correct and endpoint accepts POST requests.

---

## Future Enhancements

- [ ] Batch upload with resume capability
- [ ] Image cropping/editing before upload
- [ ] Drag reorder images
- [ ] EXIF data stripping
- [ ] Progressive image loading
- [ ] Offline image compression cache

---

## References

- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion (Framer Motion)](https://motion.dev/)
