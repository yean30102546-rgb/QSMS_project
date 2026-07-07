/**
 * Utility to add a watermark to an image using HTML Canvas.
 * Optimized for client-side mobile usage.
 */

export interface WatermarkOptions {
  fontSize?: number;
  color?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  includeLocation?: boolean;
}

/**
 * Adds a watermark string to the bottom of the image.
 * @param base64Image The source image in base64 format.
 * @param text The text to overlay (e.g., Timestamp).
 * @param options Styling and positioning options.
 * @returns A promise resolving to the watermarked base64 image.
 */
export async function addWatermark(
  base64Image: string,
  text: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    fontSize = 20,
    color = 'rgba(255, 255, 255, 0.9)',
    position = 'bottom-right'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        
        // Use original dimensions for high quality
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Adjust font size based on image width to keep it readable
        // e.g., if image is 1200px wide, and base font is 20px, scale accordingly
        const scaleFactor = canvas.width / 800;
        const adjustedFontSize = Math.max(14, Math.round(fontSize * scaleFactor));

        ctx.font = `bold ${adjustedFontSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';
        
        const padding = Math.round(20 * scaleFactor);
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = adjustedFontSize;
        
        let x = canvas.width - textWidth - padding;
        let y = canvas.height - padding;

        if (position === 'bottom-left') {
          x = padding;
        } else if (position === 'top-right') {
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
        } else if (position === 'top-left') {
          x = padding;
          y = padding + textHeight;
        }

        // Draw semi-transparent background for readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
          x - (padding / 4), 
          y - textHeight - (padding / 4), 
          textWidth + (padding / 2), 
          textHeight + (padding / 2)
        );

        // Draw the text
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        // Export as JPEG with 0.8 quality to keep size reasonable
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for watermarking'));
    img.src = base64Image;
  });
}

/**
 * Gets the current location if permitted by the user.
 * Useful for watermarking location data.
 */
export async function getCurrentLocation(): Promise<string> {
  if (!navigator.geolocation) return '';
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve(`LAT: ${latitude.toFixed(4)}, LON: ${longitude.toFixed(4)}`);
      },
      () => resolve(''), // Silently fail and return empty if blocked or error
      { timeout: 5000 }
    );
  });
}
