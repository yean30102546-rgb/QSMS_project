import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from existing env variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_URL?.match(/cloudinary:\/\/(\d+):/)?.[1] || '',
  api_secret: process.env.CLOUDINARY_URL?.match(/:([^@]+)@/)?.[1] || '',
});

/**
 * Extract public ID from Cloudinary URL
 * Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
 * Public ID: folder/image
 */
function extractPublicId(url: string): string | null {
  try {
    const parts = url.split('/upload/');
    if (parts.length !== 2) return null;
    
    // Remove version (e.g. v1234567890/) if present
    const pathParts = parts[1].split('/');
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    
    // Remove file extension
    const fullPath = pathParts.join('/');
    const publicId = fullPath.substring(0, fullPath.lastIndexOf('.'));
    
    return publicId || fullPath;
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: true, message: 'No URLs provided for rollback' });
    }

    console.log(`🧹 Cloudinary Rollback triggered for ${urls.length} images`);

    const results = [];
    
    for (const url of urls) {
      const publicId = extractPublicId(url);
      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          results.push({ url, publicId, result });
          console.log(`🗑️ Deleted from Cloudinary: ${publicId}`, result);
        } catch (delError) {
          console.error(`❌ Failed to delete ${publicId} from Cloudinary:`, delError);
          results.push({ url, publicId, error: delError });
        }
      } else {
        results.push({ url, error: 'Could not extract public ID' });
      }
    }

    return NextResponse.json(
      { success: true, results },
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    console.error('❌ Cloudinary rollback failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during rollback' },
      { status: 500 }
    );
  }
}
