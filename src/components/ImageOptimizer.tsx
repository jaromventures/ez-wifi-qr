export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export const optimizeImage = async (
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.85,
    maxSizeKB = 1024,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL with quality setting
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        // If still too large, reduce quality further
        let currentQuality = quality;
        while (
          dataUrl.length > maxSizeKB * 1024 * 1.37 && // Base64 is ~37% larger
          currentQuality > 0.5
        ) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
        }

        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    reader.readAsDataURL(file);
  });
};
