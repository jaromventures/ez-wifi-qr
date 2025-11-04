/**
 * PrintableQRGenerator - 8.5x11 inch print-ready QR code generator
 * Generates high-quality 2550x3300px canvas at 300 DPI
 */

import QRCode from "qrcode";
import { 
  PRINT_CONFIG,
  POSTER_CONFIG,
  SQUARE_4X4_CONFIG,
  CanvasConfig,
  drawTransparentBox, 
  enableHighQualityText, 
  drawTextWithShadow,
  extractColorFromRegion
} from "@/utils/canvasHelpers";

export interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: string;
  customTitle?: string;
  showTitleInPdf?: boolean;
  backgroundImage?: string;
}

// Layout zones for 8.5x11 page
const TOP_ZONE_END = 825;        // Top 25% for title
const MIDDLE_ZONE_START = 825;   // Middle 50% for QR
const MIDDLE_ZONE_END = 2475;
const BOTTOM_ZONE_START = 2475;  // Bottom 25% for credentials

const QR_SIZE = 1800; // Large, high-quality QR code

export async function generatePrintableCanvas(
  config: WiFiConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = PRINT_CONFIG.width;
  canvas.height = PRINT_CONFIG.height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  enableHighQualityText(ctx);

  // Step 1: Draw background
  if (config.backgroundImage) {
    await drawBackground(ctx, config.backgroundImage);
  } else {
    // Default gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
  }

  // Step 2: Draw title in top zone
  if (config.showTitleInPdf !== false) {
    drawTitle(ctx, config.customTitle || "Your WiFi QR Code");
  }

  // Step 3: Generate and draw QR code in middle zone
  await drawQRCode(ctx, config);

  // Step 4: Draw credentials in bottom zone
  drawCredentials(ctx, config);

  return canvas;
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  backgroundImage: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin for external URLs, not for data URLs or relative paths
    if (backgroundImage.startsWith('http://') || backgroundImage.startsWith('https://')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
        console.log("Background image drawn successfully");
        resolve();
      } catch (err) {
        console.error("Error drawing background image:", err);
        // Fallback to gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
        gradient.addColorStop(0, "#f8f9fa");
        gradient.addColorStop(1, "#e9ecef");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
        resolve();
      }
    };
    
    img.onerror = (err) => {
      console.error("Background image failed to load:", err);
      console.warn("Using gradient fallback");
      const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
      gradient.addColorStop(0, "#f8f9fa");
      gradient.addColorStop(1, "#e9ecef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
      resolve();
    };
    
    console.log("Loading background image...", backgroundImage.substring(0, 50));
    img.src = backgroundImage;
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string) {
  const centerX = PRINT_CONFIG.width / 2;
  const titleBoxY = 250;
  const titleBoxWidth = 1900;
  const titleBoxHeight = 180;

  // Extract color from title area of background
  const bgColor = extractColorFromRegion(
    ctx,
    centerX - titleBoxWidth / 2,
    titleBoxY,
    titleBoxWidth,
    titleBoxHeight,
    0.75
  );

  // Draw transparent box with extracted color
  drawTransparentBox(
    ctx,
    centerX - titleBoxWidth / 2,
    titleBoxY,
    titleBoxWidth,
    titleBoxHeight,
    30,
    bgColor
  );

  // Draw title text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 120px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  drawTextWithShadow(ctx, title, centerX, titleBoxY + titleBoxHeight / 2);
}

async function drawQRCode(
  ctx: CanvasRenderingContext2D,
  config: WiFiConfig
): Promise<void> {
  // Generate WiFi connection string
  const wifiString =
    config.encryption === "nopass"
      ? `WIFI:T:nopass;S:${config.ssid};;`
      : `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};;`;

  // Generate QR code on temporary canvas
  const qrCanvas = document.createElement("canvas");
  
  try {
    await QRCode.toCanvas(qrCanvas, wifiString, {
      width: QR_SIZE,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });

    // Make white pixels transparent
    const qrCtx = qrCanvas.getContext("2d");
    if (qrCtx) {
      const imageData = qrCtx.getImageData(0, 0, QR_SIZE, QR_SIZE);
      const data = imageData.data;
      
      // Loop through pixels and make white ones transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is white (or close to white), make it transparent
        if (r > 250 && g > 250 && b > 250) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      qrCtx.putImageData(imageData, 0, 0);
    }

    // Calculate centered position in middle zone
    const centerX = PRINT_CONFIG.width / 2;
    const middleZoneHeight = MIDDLE_ZONE_END - MIDDLE_ZONE_START;
    const qrY = MIDDLE_ZONE_START + (middleZoneHeight - QR_SIZE) / 2 - 100; // Move up for more bottom spacing

    // Extract color from QR area of background (before drawing QR)
    const padding = 40;
    const qrBgColor = extractColorFromRegion(
      ctx,
      centerX - QR_SIZE / 2 - padding,
      qrY - padding,
      QR_SIZE + (padding * 2),
      QR_SIZE + (padding * 2),
      0.85 // Slightly higher opacity (85%) for better QR scanning
    );

    // Draw rounded transparent box with extracted color
    drawTransparentBox(
      ctx,
      centerX - QR_SIZE / 2 - padding,
      qrY - padding,
      QR_SIZE + (padding * 2),
      QR_SIZE + (padding * 2),
      30, // Rounded corners to match text boxes
      qrBgColor
    );

    // Draw QR code on top
    ctx.drawImage(qrCanvas, centerX - QR_SIZE / 2, qrY, QR_SIZE, QR_SIZE);
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw error;
  }
}

function drawCredentials(ctx: CanvasRenderingContext2D, config: WiFiConfig) {
  const centerX = PRINT_CONFIG.width / 2;
  const credBoxWidth = 1900;
  const credBoxHeight = 130;

  // Network name box
  const networkY = 2600; // Move down for better spacing
  
  // Extract color from network area
  const networkBgColor = extractColorFromRegion(
    ctx,
    centerX - credBoxWidth / 2,
    networkY,
    credBoxWidth,
    credBoxHeight,
    0.80
  );
  
  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    networkY,
    credBoxWidth,
    credBoxHeight,
    30,
    networkBgColor
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 85px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Network: ${config.ssid}`, centerX, networkY + credBoxHeight / 2);

  // Password box (or "Open Network")
  const passwordY = networkY + credBoxHeight + 30;
  
  // Extract color from password area
  const passwordBgColor = extractColorFromRegion(
    ctx,
    centerX - credBoxWidth / 2,
    passwordY,
    credBoxWidth,
    credBoxHeight,
    0.80
  );
  
  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    passwordY,
    credBoxWidth,
    credBoxHeight,
    30,
    passwordBgColor
  );

  if (config.encryption === "nopass") {
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Open Network (No Password)", centerX, passwordY + credBoxHeight / 2);
  } else {
    ctx.fillStyle = "#ef4444"; // Red for password
    ctx.fillText(`Password: ${config.password}`, centerX, passwordY + credBoxHeight / 2);
  }

  // Footer branding with better visibility
  const footerY = 3150;
  const footerText = "Generated by EZ-WI-FI";
  ctx.font = "bold 60px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const footerMetrics = ctx.measureText(footerText);
  const footerWidth = footerMetrics.width + 80;

  // Extract color and draw box for footer
  const footerBgColor = extractColorFromRegion(
    ctx,
    centerX - footerWidth / 2,
    footerY - 45,
    footerWidth,
    90,
    0.75
  );

  drawTransparentBox(
    ctx,
    centerX - footerWidth / 2,
    footerY - 45,
    footerWidth,
    90,
    20,
    footerBgColor
  );

  // Draw footer text
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(footerText, centerX, footerY + 20);
}

/**
 * Generate square product canvas for 4x4" products (magnets, stickers)
 * Optimized for small square format with centered QR code
 */
export async function generateSquareProductCanvas(
  config: WiFiConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = SQUARE_4X4_CONFIG.width;
  canvas.height = SQUARE_4X4_CONFIG.height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  enableHighQualityText(ctx);

  // Draw background
  if (config.backgroundImage) {
    await drawSquareBackground(ctx, config.backgroundImage);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
  }

  // Generate WiFi string
  const wifiString =
    config.encryption === "nopass"
      ? `WIFI:T:nopass;S:${config.ssid};;`
      : `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};;`;

  // Generate large QR code for 4x4" canvas
  const qrSize = 1000; // Large QR for 4x4" @ 300 DPI
  const qrCanvas = document.createElement("canvas");
  
  await QRCode.toCanvas(qrCanvas, wifiString, {
    width: qrSize,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  // Make white pixels transparent
  const qrCtx = qrCanvas.getContext("2d");
  if (qrCtx) {
    const imageData = qrCtx.getImageData(0, 0, qrSize, qrSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r > 250 && g > 250 && b > 250) {
        data[i + 3] = 0;
      }
    }
    
    qrCtx.putImageData(imageData, 0, 0);
  }

  // Center QR code
  const centerX = SQUARE_4X4_CONFIG.width / 2;
  const centerY = SQUARE_4X4_CONFIG.height / 2;
  const qrX = centerX - qrSize / 2;
  const qrY = centerY - qrSize / 2;

  // Draw background box with extracted color
  const padding = 20;
  const qrBgColor = extractColorFromRegion(
    ctx,
    qrX - padding,
    qrY - padding,
    qrSize + (padding * 2),
    qrSize + (padding * 2),
    0.90
  );

  drawTransparentBox(
    ctx,
    qrX - padding,
    qrY - padding,
    qrSize + (padding * 2),
    qrSize + (padding * 2),
    15,
    qrBgColor
  );

  // Draw QR code
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  return canvas;
}

async function drawSquareBackground(
  ctx: CanvasRenderingContext2D,
  backgroundImage: string
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Only set crossOrigin for external URLs, not for data URLs or relative paths
    if (backgroundImage.startsWith('http://') || backgroundImage.startsWith('https://')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
        resolve();
      } catch (err) {
        console.error("Error drawing square background:", err);
        const gradient = ctx.createLinearGradient(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
        gradient.addColorStop(0, "#f8f9fa");
        gradient.addColorStop(1, "#e9ecef");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
        resolve();
      }
    };
    
    img.onerror = (err) => {
      console.error("Square background image failed to load:", err);
      const gradient = ctx.createLinearGradient(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
      gradient.addColorStop(0, "#f8f9fa");
      gradient.addColorStop(1, "#e9ecef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, SQUARE_4X4_CONFIG.width, SQUARE_4X4_CONFIG.height);
      resolve();
    };
    
    img.src = backgroundImage;
  });
}

/**
 * Generate poster canvas for 18x24" framed prints
 */
export async function generatePosterCanvas(
  config: WiFiConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_CONFIG.width;
  canvas.height = POSTER_CONFIG.height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  enableHighQualityText(ctx);

  // Draw background
  if (config.backgroundImage) {
    await drawPosterBackground(ctx, config.backgroundImage);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_CONFIG.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);
  }

  // Layout zones for poster
  const topZoneEnd = POSTER_CONFIG.height * 0.2;
  const qrZoneStart = topZoneEnd;
  const qrZoneEnd = POSTER_CONFIG.height * 0.75;
  const bottomZoneStart = qrZoneEnd;

  const centerX = POSTER_CONFIG.width / 2;

  // Draw title
  if (config.showTitleInPdf !== false) {
    const titleBoxY = 400;
    const titleBoxWidth = 4000;
    const titleBoxHeight = 300;

    const bgColor = extractColorFromRegion(
      ctx,
      centerX - titleBoxWidth / 2,
      titleBoxY,
      titleBoxWidth,
      titleBoxHeight,
      0.75
    );

    drawTransparentBox(
      ctx,
      centerX - titleBoxWidth / 2,
      titleBoxY,
      titleBoxWidth,
      titleBoxHeight,
      40,
      bgColor
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 220px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    drawTextWithShadow(ctx, config.customTitle || "Your WiFi QR Code", centerX, titleBoxY + titleBoxHeight / 2);
  }

  // Generate QR code
  const wifiString =
    config.encryption === "nopass"
      ? `WIFI:T:nopass;S:${config.ssid};;`
      : `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};;`;

  const qrSize = 3600;
  const qrCanvas = document.createElement("canvas");
  
  await QRCode.toCanvas(qrCanvas, wifiString, {
    width: qrSize,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  // Make white pixels transparent
  const qrCtx = qrCanvas.getContext("2d");
  if (qrCtx) {
    const imageData = qrCtx.getImageData(0, 0, qrSize, qrSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r > 250 && g > 250 && b > 250) {
        data[i + 3] = 0;
      }
    }
    
    qrCtx.putImageData(imageData, 0, 0);
  }

  // Position QR in middle zone
  const qrY = qrZoneStart + ((qrZoneEnd - qrZoneStart) - qrSize) / 2;
  const padding = 60;

  const qrBgColor = extractColorFromRegion(
    ctx,
    centerX - qrSize / 2 - padding,
    qrY - padding,
    qrSize + (padding * 2),
    qrSize + (padding * 2),
    0.85
  );

  drawTransparentBox(
    ctx,
    centerX - qrSize / 2 - padding,
    qrY - padding,
    qrSize + (padding * 2),
    qrSize + (padding * 2),
    40,
    qrBgColor
  );

  ctx.drawImage(qrCanvas, centerX - qrSize / 2, qrY, qrSize, qrSize);

  // Draw credentials in bottom zone
  const credBoxWidth = 4000;
  const credBoxHeight = 240;
  const networkY = bottomZoneStart + 300;

  const networkBgColor = extractColorFromRegion(
    ctx,
    centerX - credBoxWidth / 2,
    networkY,
    credBoxWidth,
    credBoxHeight,
    0.80
  );

  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    networkY,
    credBoxWidth,
    credBoxHeight,
    40,
    networkBgColor
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 160px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Network: ${config.ssid}`, centerX, networkY + credBoxHeight / 2);

  const passwordY = networkY + credBoxHeight + 50;

  const passwordBgColor = extractColorFromRegion(
    ctx,
    centerX - credBoxWidth / 2,
    passwordY,
    credBoxWidth,
    credBoxHeight,
    0.80
  );

  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    passwordY,
    credBoxWidth,
    credBoxHeight,
    40,
    passwordBgColor
  );

  if (config.encryption === "nopass") {
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Open Network (No Password)", centerX, passwordY + credBoxHeight / 2);
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`Password: ${config.password}`, centerX, passwordY + credBoxHeight / 2);
  }

  return canvas;
}

async function drawPosterBackground(
  ctx: CanvasRenderingContext2D,
  backgroundImage: string
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Only set crossOrigin for external URLs, not for data URLs or relative paths
    if (backgroundImage.startsWith('http://') || backgroundImage.startsWith('https://')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);
        resolve();
      } catch (err) {
        console.error("Error drawing poster background:", err);
        const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_CONFIG.height);
        gradient.addColorStop(0, "#f8f9fa");
        gradient.addColorStop(1, "#e9ecef");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);
        resolve();
      }
    };
    
    img.onerror = (err) => {
      console.error("Poster background image failed to load:", err);
      const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_CONFIG.height);
      gradient.addColorStop(0, "#f8f9fa");
      gradient.addColorStop(1, "#e9ecef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);
      resolve();
    };
    
    img.src = backgroundImage;
  });
}
