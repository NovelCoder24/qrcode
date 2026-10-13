/**
 * Client-Side Canvas Image Compression Utility
 * Resizes images to max 1600px on the longest edge, JPEG quality 0.8 (~200KB).
 * Preserves PDFs and unsupported formats intact.
 */

export async function compressImageForUpload(file, maxDimension = 1600, quality = 0.8) {
  if (!file) return file;

  try {
    // PDFs, files without mime type, or non-image files are returned as-is
    if (!file.type || file.type === 'application/pdf' || !file.type.startsWith('image/')) {
      return file;
    }

    return await new Promise((resolve) => {
      // If running in an environment without DOM, fallback safely
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              let { width, height } = img;

              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = Math.round((height * maxDimension) / width);
                  width = maxDimension;
                } else {
                  width = Math.round((width * maxDimension) / height);
                  height = maxDimension;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                return resolve(file);
              }

              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    return resolve(file);
                  }
                  try {
                    const compressedFileName = (file.name || 'menu-page').replace(/\.[^/.]+$/, '') + '.jpg';
                    const compressedFile = new File([blob], compressedFileName, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  } catch (fileConstructErr) {
                    // Fallback for older browsers without File constructor
                    blob.name = 'menu-page.jpg';
                    resolve(blob);
                  }
                },
                'image/jpeg',
                quality
              );
            } catch (canvasErr) {
              resolve(file);
            }
          };

          img.onerror = () => {
            resolve(file);
          };

          img.src = event.target.result;
        } catch (innerErr) {
          resolve(file);
        }
      };

      reader.onerror = () => {
        resolve(file);
      };

      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.warn('[imageCompressor] Compression skipped, using original file:', err);
    return file;
  }
}

/**
 * Compresses an array of files in parallel (up to 8 files).
 */
export async function compressMultipleFiles(files = []) {
  if (!files || files.length === 0) return [];
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((f) => compressImageForUpload(f)));
}
