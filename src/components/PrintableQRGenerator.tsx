/**
 * PrintableQRGenerator - 8.5x11 inch print-ready QR code generator
 * Generates high-quality 2550x3300px canvas at 300 DPI
 */

import QRCode from "qrcode";
import { 
  PRINT_CONFIG, 
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
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
      resolve();
    };
    
    img.onerror = () => {
      console.warn("Background image failed to load, using gradient fallback");
      const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
      gradient.addColorStop(0, "#f8f9fa");
      gradient.addColorStop(1, "#e9ecef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
      resolve();
    };
    
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
    const qrY = MIDDLE_ZONE_START + (middleZoneHeight - QR_SIZE) / 2;

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
